import axios from "axios";
import pgp from "pg-promise";

axios.defaults.validateStatus = () => true;

const connection = pgp()("postgres://postgres:123456@localhost:5432/app");

afterAll(async () => {
    await connection.$pool.end();
})

test("Deve realizar um depósito com sucesso", async () => {
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
        quantity: 1
    }
    const responseDeposit = await axios.post("http://localhost:3000/deposit", inputDeposit)
    const outputDeposit = responseDeposit.data;
    expect(responseDeposit.status).toBe(200)
    expect(outputDeposit.transactionId).toBeDefined()
    expect(outputDeposit.accountId).toBe(inputDeposit.accountId)
});

test("Não deve realizar um depósito com uma conta inexistente", async () => {
    const accountId = crypto.randomUUID();
    
    const inputDeposit = {
        accountId: accountId,
        assetId: "BTC",
        quantity: -1
    }
    
    const responseDeposit = await axios.post("http://localhost:3000/deposit", inputDeposit)
    const outputDeposit = responseDeposit.data;

    expect(responseDeposit.status).toBe(422);
    expect(outputDeposit.error).toBe("Account does not exist");
});

test("Não deve realizar um depósito com asset inválido", async () => {
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
        accountId: accountId,
        assetId: "BTCy",
        quantity: 1
    }
    
    const responseDeposit = await axios.post("http://localhost:3000/deposit", inputDeposit)
    const outputDeposit = responseDeposit.data;

    expect(responseDeposit.status).toBe(422);
    expect(outputDeposit.error).toBe("Invalid asset");

});

test("Não deve realizar um depósito com quantidade inválida", async () => {
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
        accountId: accountId,
        assetId: "BTC",
        quantity: -1
    }
    
    const responseDeposit = await axios.post("http://localhost:3000/deposit", inputDeposit)
    const outputDeposit = responseDeposit.data;

    expect(responseDeposit.status).toBe(422);
    expect(outputDeposit.error).toBe("Invalid quantity");
});