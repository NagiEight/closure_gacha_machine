import crypto from "crypto";

/**
 * Generate a unique uuid using {@link Prerequisite} to checks if that uuid already exists.
 */
const GenerateToken = (Prerequisite: (Token: string) => boolean): string => {
    let Token: string;
    
    do Token = crypto.randomUUID();
    while(Prerequisite(Token));
    
    return Token;
};

export default GenerateToken;