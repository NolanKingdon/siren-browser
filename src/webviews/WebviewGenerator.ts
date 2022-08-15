import { Event } from "../events/Event";

interface WebviewGenerator {
    sendEvent(event: Event): void 
}

export default WebviewGenerator;