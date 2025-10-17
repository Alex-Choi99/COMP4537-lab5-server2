const http = require('http');
const url = require('url');
const mysql = require('mysql');
require('dotenv').config();

const DB_CONNECTION_MSG     = "Connected to database.\n";
const DB_HOST               = process.env.DB_HOST;
const DB_USER               = process.env.DB_USER;
const DB_PASSWORD           = process.env.DB_PASSWORD;
const DB_NAME               = process.env.DB_NAME;
const HEADER_CONTENT_TYPE   = "Content-Type";
const HEADER_JSON_CONTENT   = "application/json";
const GET                   = "GET";
const POST                  = "POST";
const OPTIONS               = "OPTIONS";
const BODY_DEFAULT          = "";
const ALL                   = "*";
const UPDATE                = "UPDATE";
const DROP                  = "DROP";
const DELETE                = "DELETE";
const QUERY_TYPE            = "string";
const SQL_CMD_ERROR_MSG     = "SQL command not valid";
const DATA                  = "data";
const END                   = "end";
const CORS = {
    ORIGIN: 'Access-Control-Allow-Origin',
    METHODS: 'Access-Control-Allow-Methods',
    HEADERS: 'Access-Control-Allow-Headers'
};

const UNSUPPORT_REQ_MSG = "Unsupported request method.\n";
const POST_SUCCESS_MSG  = "Data inserted successfully.\n";
const POST_FAIL_MSG     = "Data insertion failed.\n";
const GET_FAIL_MSG      = "Data retrieval failed.\n";
const PORT      = 3000;

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
     * Runs the application.
     */
    static main() {
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
        });

        this.runServer(db);
    }

    /**
     * Runs the server, connects to the database, and listens for requests
     * @param db The database connection
     */
    static runServer(db) {
        const server = http.createServer((req, res) => {
            switch (req.method) {
                case OPTIONS:
                    res.setHeader(CORS.ORIGIN, ALL);
                    res.setHeader(CORS.METHODS, `${GET}, ${POST}, ${OPTIONS}`);
                    res.setHeader(CORS.HEADERS, HEADER_CONTENT_TYPE);
                    res.end();
                    break;

                case GET:
                    res.setHeader(CORS.ORIGIN, ALL);
                    res.setHeader(HEADER_CONTENT_TYPE, HEADER_JSON_CONTENT);

                    const query = url.parse(req.url, true).query;
                    const sql = this.validateSqlCommand(query);

                    if (!sql) {
                        res.writeHead(400, { [HEADER_CONTENT_TYPE]: HEADER_JSON_CONTENT });
                        res.end(JSON.stringify({ error: "Invalid SQL command" }));
                        return;
                    }

                    db.query(sql, (err, results) => {
                        if (err) {
                            res.end(JSON.stringify({ message: GET_FAIL_MSG }));
                        } else {
                            res.end(JSON.stringify(results));
                        }
                    });
                    break;

                case POST:
                    let body = BODY_DEFAULT;

                    res.setHeader(CORS.ORIGIN, ALL);
                    req.on(DATA, chunk => body += chunk.toString());
                    req.on(END, () => {
                        const sql = this.validateSqlCommand(body);

                        if (!sql) {
                            res.writeHead(400, { [HEADER_CONTENT_TYPE]: HEADER_JSON_CONTENT });
                            res.end(JSON.stringify({ error: "Invalid SQL command" }));
                            return;
                        }

                        db.query(sql, (err, results) => {
                            if (err) {
                                res.end(JSON.stringify({ message: POST_FAIL_MSG }));
                            } else {
                                res.end(JSON.stringify({ message: POST_SUCCESS_MSG }));
                            }
                        });
                    });
                    break;

                default:
                    res.write(UNSUPPORT_REQ_MSG);
                    res.end(req.method);
                    break;
            }
        });

        server.listen(PORT, () => {
            console.log(`${PORT}`);
        });
    }

    /**
     * Generates a SQL command for requests
     * @param {*} queryParams | The query parameters from the URL
     * @returns {string|null} The SQL command or null if invalid
     */
    static validateSqlCommand(query) {
        let sql = null;

        try {
            const queryStr = typeof query === QUERY_TYPE ? query : JSON.stringify(query);
            const parsedQuery = JSON.parse(queryStr);

            if (parsedQuery.query &&
                !parsedQuery.query.startsWith(UPDATE) &&
                !parsedQuery.query.startsWith(DROP) &&
                !parsedQuery.query.startsWith(DELETE)) {
                sql = parsedQuery.query;
            } else {
                console.error(SQL_CMD_ERROR_MSG);
            }
        } catch (e) {
            console.error("Error parsing SQL command:", e.message);
        }

        return sql;
    }
}

module.exports = Main;
