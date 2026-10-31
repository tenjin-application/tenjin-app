import 'express-session';

// Black magic right here.
declare module 'express-session' {
    interface SessionData {
        userId: number;
    }
}