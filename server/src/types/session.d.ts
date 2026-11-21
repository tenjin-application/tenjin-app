import 'express-session';

// Black magic right here (really this is needed because typescript can't recognize our session id otherwise).
declare module 'express-session' {
    interface SessionData {
        userId: number;
    }
}