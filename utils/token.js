import jwt from 'jsonwebtoken'

export const generateToken = (id,role)=>{
    try {

        const token  = jwt.sign({id,role},process.env.JWT_SECRET)
        return token

        
    } catch (error) {
        console.log(error);
        
        
    }
}

// id  and role ======  dkflahdkfaldfodisfklfsodlkhogsodksldkglkdghslkgslkdghskldgskdhgs