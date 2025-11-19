# Annexe B : Spécification OpenAPI

Ce document est une annexe au document d'architecture principal et fournit la spécification complète de l'API au format OpenAPI 3.0.

```yaml
openapi: 3.0.0
info:
  title: Recyclic API
  version: 1.0.0
  description: API REST pour la plateforme Recyclic
servers:
  - url: /api/v1
    description: Serveur local

paths:
  /health:
    get:
      summary: Health Check
      tags: ["Health"]
      responses:
        200:
          description: Réponse de succès

  /admin/users:
    get:
      summary: Lister les utilisateurs (Admin)
      tags: ["Admin"]
      security:
        - BearerAuth: []
      parameters:
        - in: query
          name: skip
          schema:
            type: integer
            default: 0
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
      responses:
        200:
          description: Liste des utilisateurs
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/AdminUser'

  /admin/users/{user_id}/role:
    put:
      summary: Mettre à jour le rôle d'un utilisateur (Admin)
      tags: ["Admin"]
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: user_id
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserRoleUpdate'
      responses:
        200:
          description: Rôle mis à jour
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AdminUser'

components:
  schemas:
    UserRole:
      type: string
      enum: [super-admin, admin, manager, cashier, user]

    UserStatus:
      type: string
      enum: [pending, approved, rejected]

    AdminUser:
      type: object
      properties:
        id:
          type: string
          format: uuid
        telegram_id:
          type: string
        username:
          type: string
          nullable: true
        full_name:
          type: string
          nullable: true
        role:
          $ref: '#/components/schemas/UserRole'
        status:
          $ref: '#/components/schemas/UserStatus'
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    UserRoleUpdate:
      type: object
      required: [role]
      properties:
        role:
          $ref: '#/components/schemas/UserRole'

    UserActivityEvent:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        event_type:
          type: string
          description: "Type d'événement (ex: 'user_status_change', 'sale', 'deposit')"
        description:
          type: string
          description: "Description lisible de l'événement"
        details:
          type: object
          additionalProperties: true

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
      role:
          $ref: '#/components/schemas/UserRole'

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
