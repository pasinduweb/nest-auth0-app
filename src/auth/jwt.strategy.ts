import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const jwksUri = `https://${process.env.AUTH0_ISSUER_URL}/.well-known/jwks.json`;
    const issuer = `https://${process.env.AUTH0_ISSUER_URL}/`;
    const strategyOptions: StrategyOptions = {
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
        handleSigningKeyError: (err, cb) => {
          // console.error('JWKS err:', err);
          cb(err);
        },
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer,
      algorithms: ['RS256'],
    };

    super(strategyOptions);
  }

  validate(payload: any): any {
    // console.log('JWT Payload validated:', payload);
    return payload;
  }
}
