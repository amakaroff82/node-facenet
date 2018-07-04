import { Server, createServer } from 'http';
import { serveStatic } from './static-server';
import { FacenetService } from './facenet-service';

const PORT = 8080;

export class FNServer {
  private server: Server
  private facenetService: FacenetService

  constructor() {
    this.facenetService = new FacenetService(() => {
      this.startServer();
    });
  }

  private startServer() : void {
    this.server = createServer((request, response) => {

        if(request.method === "POST" && request.url && request.url.indexOf('/api') === 0){
          this.facenetService.serveApi(request, response);
        } else if (request.method === "GET"){
          serveStatic(request, response);
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
