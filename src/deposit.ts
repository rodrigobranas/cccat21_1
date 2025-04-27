import express, { Request, Response } from "express";
import crypto from "crypto";
import pgp from "pg-promise";

const app = express();
app.use(express.json());

const connection = pgp()("postgres://postgres:123456@localhost:5432/app")

console.log("Rodando deposit controller")

function isValidAsset (asset: string) {
    return asset === "BTC" || asset === "USD";
}

function isValidQuantity (quantity: number) {
    return quantity > 0;
}

app.post("/deposit", async (req: Request, res: Response) => {
    const input = req.body;
    const accountToVinculate = input.accountId;

    const [accountData] = await connection.query("select * from ccca.account where account_id = $1", [accountToVinculate]);

    if (accountData == null){
        return res.status(422).json({
            error: "Account does not exist"
        })
    }

    if (!isValidAsset(input.assetId)) {
        return res.status(422).json({
            error: "Invalid asset"
        })
    }

    if (!isValidQuantity(input.quantity)) {
        return res.status(422).json({
            error: "Invalid quantity"
        });
    }

    const transactionId = crypto.randomUUID();
    const accountId = input.accountId;
    const deposit = {
        transactionId,
        accountId: input.accountId,
        assetId: input.assetId,
        quantity: input.quantity,        
    }

    await connection.query("insert into ccca.account_asset (account_id, transaction_id, asset_id, quantity) values ($1, $2, $3, $4)", [deposit.accountId, deposit.transactionId, deposit.assetId, deposit.quantity]);

    res.json({
        transactionId,
        accountId,
    });
})

app.listen(3000);