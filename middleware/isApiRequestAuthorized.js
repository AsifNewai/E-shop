const { expressjwt } = require('express-jwt');
require('dotenv/config');

function authGuard(){
    const secret = process.env.SECRET_KEY;
    return expressjwt({'secret':secret,'algorithms': ["HS256"],isRevoked:isRevoked}).unless({
      path:[
        {url:/\/public\/upload(.*)/,methods:['GET','OPTIONS']},
        {url:/\/product(.*)/,methods:['GET','OPTIONS']},
        {url:/\/category(.*)/,methods:['GET','OPTIONS']},
        '/user/login','/user/register']
      })
}

async function isRevoked(req,payload,done){
    let user = payload.payload;
    if (user.isAdmin == false) {
      return true;
    }
    return false;
}

module.exports = authGuard();