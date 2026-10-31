import type { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // Gather the user id (session should already be resolved).
    const sessionUserId = req.session.userId;

    // If it's undefined, it means the user has not yet logged in.
    if (sessionUserId === undefined) return res.status(401).json({ error: "Not signed in." });
    
    // Otherwise the user is logged in, continue on.
    next();
}