import { Facenet } from '../'
import { IncomingMessage, ServerResponse, Server, createServer } from 'http';
import { extname } from 'path';
import { readFile, writeFile, unlink } from 'fs';
//import {saveImage} from '../src/misc';

const PORT = 8080;
const STATIC_FILES_DIR = 'admin';

export class FNServer {
  private facenet: Facenet
  private server: Server
  private isReady: Boolean

  constructor() {
    this.isReady = false;
    this.facenet = new Facenet();
    this.warmUp();
  }

  private async warmUp() : Promise<void> {
    try {
      await this.startServer();

      // Load image from file
      const imageFile = `${__dirname}/../tests/fixtures/two-faces.jpg`
      // Do Face Alignment, return faces
      let faceList = await this.facenet.align(imageFile);
      await this.facenet.embedding(faceList[0]);
      await this.facenet.embedding(faceList[1]);
    } finally {
      this.isReady = true;
      console.log('Facenet started');
    }
  }

  private serveStatic(request: IncomingMessage, response: ServerResponse) : void {

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    response.setHeader('Access-Control-Allow-Credentials', 'true');


    let filePath = request.url;

    if (filePath == '/')
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
        if(error.code == 'ENOENT'){
          readFile('./404.html', function(error, content) {
            if(error) {
              response.writeHead(500);
              response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            } else {
              response.writeHead(200, { 'Content-Type': contentType });
              response.end(content, 'utf-8');
            }
          });
        }
        else {
          response.writeHead(500);
          response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
        }
      }
      else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });
  }

  private serveApi(request: IncomingMessage, response: ServerResponse) : void {
    response.setHeader('Content-Type', 'application/json');
    response.writeHead(200);
    if(this.isReady){
      var payload = "";
      request.on('data', (data) => {
        payload += data;
      });
      request.on('end', () => {
        const data = JSON.parse(payload);
        if(data.command === 1){
          let base64Image = payload.split(';base64,').pop();

          const newFileName = (new Date()).getTime().toString() + '-' + Math.round(Math.random() * 100000) + '.jpg';

          writeFile(newFileName, base64Image, {encoding: 'base64'}, (err) => {
            if(err){
              response.write('{}');
              response.end();
              return;
            }

            this.facenet.align(newFileName).then((faceList) => {
              this.buildEmbbedings(faceList).then(() => {
                response.write(JSON.stringify(faceList.map(item => ({
                  location: item.location,
                  landmark: item.landmark,
                  embedding: item.embedding ? item.embedding.tolist() : []
                }))));
                response.end();

                unlink(newFileName, ()=>{});
              });
            });
          });
        }else{
          response.write('{}');
          response.end();
        }

      });
    }else{
      response.write('{}');
      response.end();
    }
  }

  private async buildEmbbedings(faceList) : Promise<void> {
    for(var i = 0; i < faceList.length; i++) {
      var emb = await this.facenet.embedding(faceList[i])
      faceList[i].embedding = emb; //.tolist();
    }
  }

  private startServer() : void {
    this.server = createServer((request, response) => {

        if(request.method === "POST" && request.url && request.url.indexOf('/api') === 0){
          console.log(">>> POST");
          this.serveApi(request, response);
        } else if (request.method === "GET"){
          this.serveStatic(request, response);
        } else {
          response.end();
        }
      }
    );
    this.server.listen(PORT, (err) => {
      if(err){
        console.log('Error', err);
        return;
      }
      console.log('HTTP Server started');
    });
  }
}
