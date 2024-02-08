/**
 * @swagger
 * components:
 *   securitySchemes:
 *     Tapp:
 *       type: oauth2
 *       flows:
 *         implicit:
 *           authorizationUrl: https://localhost:9443/oauth2/authorize
 *           scopes:
 *             read: openid profile
 * */