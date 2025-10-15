/**
 * A NodeJS app that serves 1 table in a database without express.
 * Accept SQL queries on table via POST to INSERT or read via SELECT
 * 
 * @author Alex Choi
 * @author Alfredo Luzardo
 */

const http = require('http');
const url = require('url');

