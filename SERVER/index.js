require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const mysql = require('mysql2');
const { database } = require('./keys');
const { google  } = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
});
const PUERTO = 4300;

app.use(morgan('dev'));

app.get('/', async function (solicitud, respuesta) {
    const conexion = mysql.createConnection({
        host: database.host,
        user: database.user,
        password: database.password,
        port: database.port,
        database: database.database
    });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const client = await auth.getClient();
    const googleSheet = google.sheets({ version: 'v4', auth: client });
    try {
        let sql = `SELECT DISTINCT indice FROM ${process.env.TABLE_CRIPTO_TICKER}`;
        conexion.query(sql, function (err, resultado) {
            if (err) throw err;
            agregarIndices(resultado);
        });
    } catch (error) {
        console.log(error);
    }

    async function agregarIndices(resultado) {
        var arreglo = [];
        resultado.map((item) => {
            arreglo.push([item.indice]);
        });
        await googleSheet.spreadsheets.values.clear({
            auth,
            spreadsheetId,
            range: `${process.env.ID_HOJA}`
        });
        await googleSheet.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: `${process.env.ID_HOJA}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                "range": `${process.env.ID_HOJA}`,
                "values": arreglo
            }
        });
    };
    respuesta.send("OK");
});

app.listen(PUERTO || process.env.PORT, () => {
    console.log(`Escuchando en el puerto ${PUERTO || process.env.PORT}`);
});
