import {IncomingMessage, ServerResponse} from 'http';
import {readFile} from 'fs';
import {extname} from 'path';

const STATIC_FILES_DIR = 'admin';

export function serveStatic(request: IncomingMessage, response: ServerResponse) : void {
  response.setHeader('Access-Control-Allow-Origin', '10.10.0.74');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', 'true');

  let filePath = request.url;

  if (filePath === '/')
    filePath = '/index.html';

  filePath = __dirname + '/' + STATIC_FILES_DIR + filePath;

  const ext = extname(filePath);
  let contentType = 'text/html';
  switch (ext) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.wav':
      contentType = 'audio/wav';
      break;
  }

  readFile(filePath, (error, content) => {

    if (error) {
      if(error.code === 'ENOENT'){
        readFile('./404.html', function(error, content) {
          if(error) {
            response.writeHead(500);
            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
          }
        });
      }
      else {
        response.writeHead(500);
        response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    }
    else {
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    }
  });
}
