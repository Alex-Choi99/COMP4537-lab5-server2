const http = require('http');
const url = require('url');
const mysql = require('mysql');

const DB_CONNECTION_MSG   = "Connected to database.\n";
const DB_HOST             = "localhost";
const DB_USER             = "root";
const DB_PASSWORD         = "";
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

const TABLE_CREATION_QUERY = `
CREATE TABLE IF NOT EXISTS ${DB_TABLE} (
    patientid INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    dateOfBirth DATE
) ENGINE=InnoDB;
`;

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

        db.connect((err) => {
            if (err) {
                throw err;
            }
            console.log(DB_CONNECTION_MSG);

            // Create the table if it doesn't exist
            db.query(TABLE_CREATION_QUERY, (err, result) => {
                if (err) {
                    throw err;
                }
                console.log("Table ensured to exist.");
            });
        });

        const server = http.createServer((req, res) => {
            res.setHeader(CORS.ORIGIN, ALL);
            res.setHeader(CORS.METHODS, `${GET}, ${POST}, ${OPTIONS}`);
            res.setHeader(CORS.HEADERS, `${HEADER_CONTENT_TYPE}`);

            switch (req.method) {
                case OPTIONS:
                    res.writeHead(STATUS_OK);
                    res.end();
                    break;

                case GET:
                    const queryParams = url.parse(req.url, true).query;
                    const { sql } = this.getSqlCommandGet(queryParams);

                    db.query(sql, (err, result) => {
                        if (err) {
                            res.writeHead(500, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                            res.end(JSON.stringify({ error: "Invalid query." }));
                            return;
                        }

                        res.writeHead(STATUS_OK, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                        res.end(JSON.stringify(result));
                    });
                    break;

                case POST:
                    let body = BODY_DEFAULT;
                    req.on("data", chunk => {
                        body += chunk;
                    });

                    req.on("end", () => {
                        try {
                            const sql = this.getSqlCommandPost(body);
                            db.query(sql, (err, result) => {
                                if (err) {
                                    res.writeHead(500, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                                    res.end(JSON.stringify({ error: "Invalid query." }));
                                    return;
                                }

                                res.writeHead(201, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                                res.end(JSON.stringify({ message: POST_SUCCESS_MSG }));
                            });
                        } catch (err) {
                            res.writeHead(400, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                            res.end(JSON.stringify({ error: "Invalid data." }));
                        }
                    });
                    break;

                default:
                    res.writeHead(405, { HEADER_CONTENT_TYPE: HEADER_JSON_CONTENT });
                    res.end(JSON.stringify({ error: UNSUPPORT_REQ_MSG }));
                    break;
            }
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

        if (queryParams.dateOfBirth) {
            sql += ` AND dateOfBirth = ${queryParams.dateOfBirth}`;
        }

        const values = [];
        if (queryParams.id) {
            values.push(queryParams.id);
        }

        if (queryParams.name) {
            values.push(queryParams.name);
        }

        if (queryParams.dateOfBirth) {
            values.push(queryParams.dateOfBirth);
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
