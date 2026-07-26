import crypto from "crypto";

const GenerateToken = (Prerequisite: (Token: string) => boolean): string => {
    let Token: string;
    
    do {
        Token = crypto.randomUUID();
    } while(Prerequisite(Token));
    
    return Token;
};

export default GenerateToken;