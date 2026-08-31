import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173'
    },
})
export class IncidentsGateway {
    @WebSocketServer()
    server: Server;

    emitIncidentUpdated(incidentId: string) {
        this.server.emit('incident.updated', { incidentId });
    }
}