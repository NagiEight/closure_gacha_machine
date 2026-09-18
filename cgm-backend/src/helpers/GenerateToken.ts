import crypto from "crypto";

export default (Prerequisite: (Token: string) => boolean): string => {
    let Token: string;
    
    do Token = crypto.randomUUID();
    while(Prerequisite(Token));
    
    return Token;
};