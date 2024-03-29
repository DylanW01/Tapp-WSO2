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
 *             read_tickets: 'Grants read access to tickets'
 *             read_bowsers: 'Grants read access to browsers'
 *             update_bowsers: 'Grants update access to browsers'
 *             update_tickets: 'Grants update access to tickets'
 * */