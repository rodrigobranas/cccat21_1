import axios from "axios"
import pgp from "pg-promise"

axios.defaults.validateStatus = () => true;

const connection = pgp()("postgres://postgres:123456@localhost:5432/app");

afterAll(async () => {
    await connection.$pool.end();
})

test("Deve realizar um saque", async () => {
    const accountId = crypto.randomUUID();

    const account = {
        accountId: accountId,
        name: "Teste Deposit",
        email: "teste@email.com",
        document: "97456321558",
        password: "asdQWE123"
    }

    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);

    const inputDeposit = {
        accountId,
        assetId: "BTC",
        quantity: 10
    }

    const generatedTransactionId = crypto.randomUUID();

    await connection.query("insert into ccca.account_asset (account_id, transaction_id, asset_id, quantity) values ($1, $2, $3, $4)", [inputDeposit.accountId, generatedTransactionId, inputDeposit.assetId, inputDeposit.quantity])

    const inputWithdraw = {
        accountId: accountId,
        assetId: inputDeposit.assetId,
        quantity: 5
    }

    const responseWithdraw = await axios.post("http://localhost:3000/withdraw", inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(200);
    
    const [accountBalance] = await connection.query("select * from ccca.account_asset where account_id = $1", [accountId])

    const updatedBalance = inputDeposit.quantity-inputWithdraw.quantity;

    expect(accountBalance.quantity).toBe(updatedBalance.toString())
});

test("Não deve realizar um saque de conta inexistete", async () => {
    const accountId = crypto.randomUUID();

    const inputWithdraw = {
        accountId: accountId,
        assetId: "BTC",
        quantity: 5
    }

    const responseWithdraw = await axios.post("http://localhost:3000/withdraw", inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe("Account does not exist")
})

test("Não deve realizar um saque de asset inválido", async () => {
    const accountId = crypto.randomUUID();

    const account = {
        accountId: accountId,
        name: "Teste Deposit",
        email: "teste@email.com",
        document: "97456321558",
        password: "asdQWE123"
    }

    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);


    const inputWithdraw = {
        accountId: accountId,
        assetId: "BTCa",
        quantity: 5
    }

    const responseWithdraw = await axios.post("http://localhost:3000/withdraw", inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe("Invalid asset")
})

test("Não deve realizar um saque de quantidade inválida", async () => {
    const accountId = crypto.randomUUID();

    const account = {
        accountId: accountId,
        name: "Teste Deposit",
        email: "teste@email.com",
        document: "97456321558",
        password: "asdQWE123"
    }

    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);


    const inputWithdraw = {
        accountId: accountId,
        assetId: "BTC",
        quantity: -5
    }

    const responseWithdraw = await axios.post("http://localhost:3000/withdraw", inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe("Invalid quantity")
})

test("Não deve realizar um saque com saldo insuficiente", async () => {
    const accountId = crypto.randomUUID();

    const account = {
        accountId: accountId,
        name: "Teste Deposit",
        email: "teste@email.com",
        document: "97456321558",
        password: "asdQWE123"
    }

    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);


    const inputWithdraw = {
        accountId: accountId,
        assetId: "BTC",
        quantity: 5
    }

    const responseWithdraw = await axios.post("http://localhost:3000/withdraw", inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe("Not enough balance")
})