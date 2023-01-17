import { compare } from 'bcrypt';

export async function verifyPassword(req, users) {
    let plainPassword = req.body.password;
    let hashedPassword;
    let user = await users.findOne( {email:req.body.email});
    return new Promise((resolve, reject) => {
        if(user !== null) {
            hashedPassword = user.password;
        }
        else {
            resolve(false);
        }
        compare(plainPassword, hashedPassword, (err, result) => {
            
            if (result) {
                resolve(true);
            }
            resolve(false);
        });
    });
}
