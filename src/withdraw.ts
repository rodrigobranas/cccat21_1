import express, { Request, Response } from "express";
import pgp from "pg-promise";

const app = express();
app.use(express.json());

const connection = pgp()("postgres://postgres:123456@localhost:5432/app")

console.log("Rodando withdraw controller")

function isValidAsset (asset: string) {
    return asset === "BTC" || asset === "USD";
}

async function hasEnoughBalance (accountId: string, assetId: string, quantity: number) {
    try {
        const result = await connection.query("select quantity from ccca.account_asset where account_id = $1 and asset_id= $2", [accountId, assetId])

        if (!result || result.length === 0) return false;

        const accountBalance = result[0];

        if (accountBalance.quantity === undefined) {
            return false;
        }

        const currentBalance = Number(accountBalance.quantity)

        const hasSufficientFunds = currentBalance >= quantity;

        return hasSufficientFunds;
    } catch (error) {
        console.error("Error while checking balance:", error);
        return false;
    }
}

function isValidQuantity (quantity: number) {
    return quantity > 0;
}

app.post("/withdraw", async (req: Request, res: Response) => {
    const input = req.body;
    const accountToVinculate = input.accountId;
    
    const withdrawAmount = Number(input.quantity);

    const accountDataResult = await connection.query("select * from ccca.account where account_id = $1", [accountToVinculate]);

    if (!accountDataResult || accountDataResult.length === 0){
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

    const hasSufficientFunds = await hasEnoughBalance(input.accountId, input.assetId, input.quantity);

    if (!hasSufficientFunds) {
        return res.status(422).json({
            error: "Not enough balance"
        })
    }

    const balanceResult = await connection.query("select * from ccca.account_asset where account_id = $1 and asset_id= $2", [input.accountId, input.assetId])

    const accountBalance = balanceResult[0]

    const accountBalanceAmount = Number(accountBalance.quantity);

    if (isNaN(accountBalanceAmount)) {
        return res.status(500).json({
            error: "Invalid balance value in database"
        });
    }

    const updatedBalance = accountBalanceAmount - withdrawAmount;

    console.log("novo saldo $1", accountBalanceAmount)

    await connection.query("update ccca.account_asset set quantity = $1 where account_id = $2 and asset_id = $3", [Number(updatedBalance), input.accountId, input.assetId])

    res.status(200).json({
        accountId: input.accountId,
        assetId: input.assetId,
        quantity: input.quantity,
        balance: updatedBalance
    })
})

app.listen(3000);