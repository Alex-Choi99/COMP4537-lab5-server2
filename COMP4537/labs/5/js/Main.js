const http = require('http');
const url = require('url');
const mysql = require('mysql');

const DB_CONNECTION_MSG   = "Connected to database.\n";
const DB_HOST             = "localhost";
const DB_USER             = "root";
const DB_PASSWORD         = "password";
const DB_NAME             = "COMP4537-lab5";
const DB_TABLE            = "patients";
const HEADER_CONTENT_TYPE = "Content-Type";
const HEADER_JSON_CONTENT = "application/json";
const GET                 = "GET";
const POST                = "POST";
const OPTIONS             = "OPTIONS";
const BODY_DEFAULT        = "";
const ALL                 = "*";
const CORS = {
    ORIGIN: 'Access-Control-Allow-Origin',
    METHODS: 'Access-Control-Allow-Methods',
    HEADERS: 'Access-Control-Allow-Headers'
};

const UNSUPPORT_REQ_MSG = "Unsupported request method.\n";
const POST_SUCCESS_MSG  = "Data inserted successfully.\n";
const STATUS_OK         = 200;
const PORT              = 3000;

/**
 * Main class
 * @class Main
 * @author Alfredo Luzardo
 * @author Alex Choi
 * @version 1.0
 * @date 10/15/2024
 */
class Main {

    /**
     * Main entry point
     */
    main() {
        this.runServer();
    }

    /**
     * Runs the server, connects to the database, and listens for requests
     */
    runServer() {    
        const db = mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        const server = http.createServer((req, res) => {
            db.connect((err) => {
                if (err) {
                    throw err;
                }

                res.write(DB_CONNECTION_MSG);

                switch (req.method) {
                    case OPTIONS:
                        res.setHeader(CORS.ORIGIN, ALL);
                        res.setHeader(CORS.METHODS, `${GET}, ${POST}, ${OPTIONS}`);
                        res.setHeader(CORS.HEADERS, HEADER_CONTENT_TYPE);
                        res.end();
                        break;

                    case GET:
                        res.setHeader(CORS.ORIGIN, ALL);
                        
                        const parsedUrl   = url.parse(req.url, true);
                        const queryParams = parsedUrl.query;
                        const sql         = this.getSqlCommandGet(queryParams);

                        db.query(sql, (err, results) => {
                            if (err) throw err;
                            const returnedData = results;
                            res.writeHead(STATUS_OK, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                            res.end(JSON.stringify(returnedData));
                        });
                        
                        break;

                    case POST:
                        let body = BODY_DEFAULT;

                        res.setHeader(CORS.ORIGIN, ALL);

                        req.on('data', chunk => {
                            body += chunk.toString();
                        });

                        req.on('end', () => {
                            const sql = this.getSqlCommandPost(body);

                            db.query(sql, (err, results) => {
                                if (err) throw err;
                            });

                            res.writeHead(STATUS_OK, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                            res.end(JSON.stringify({ message: POST_SUCCESS_MSG }));
                        });
                        break;

                    default:
                        res.write(UNSUPPORT_REQ_MSG);
                        res.end(req.method);
                        break;
                }
            });
        });

        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    }

    /**
     * Generates a SQL command for GET requests
     * @param {*} queryParams 
     * @returns 
     */
    getSqlCommandGet(queryParams) {
        let sql = `SELECT * FROM ${DB_TABLE} WHERE 1=1`;

        if (queryParams.id) {
            sql += ` AND id = ${queryParams.id}`;
        }

        if (queryParams.name) {
            sql += ` AND name LIKE ${queryParams.name}`;
        }

        return { sql, values };
    }

    /**
     * Generates a SQL command for POST requests
     * @param {*} body 
     * @returns 
     */
    getSqlCommandPost(body) {
        const data = JSON.parse(body);
        const sql = `INSERT INTO ${DB_TABLE} (name, date) VALUES (${data.name}, ${data.date})`;

        return sql;
    }
}

module.exports = Main;