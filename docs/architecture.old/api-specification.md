# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Recyclic API
  version: 1.0.0
  description: API REST pour gestion ressourcerie avec bot Telegram et interface caisse
servers:
  - url: https://api.recyclic.local
    description: Serveur local de développement
  - url: https://your-domain.com/api
    description: Serveur de production

paths:
  /auth/telegram:
    post:
      summary: Authentification via Telegram
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                telegram_id:
                  type: number
                auth_hash:
                  type: string
      responses:
        200:
          description: Authentification réussie
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

  /deposits:
    get:
      summary: Liste des dépôts
      parameters:
        - name: site_id
          in: query
          required: true
          schema:
            type: string
      responses:
        200:
          description: Liste des dépôts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Deposit'
    
    post:
      summary: Créer un dépôt
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DepositCreate'
      responses:
        201:
          description: Dépôt créé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Deposit'

  /deposits/{deposit_id}/classify:
    post:
      summary: Classification IA d'un dépôt
      parameters:
        - name: deposit_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                description:
                  type: string
                audio_file:
                  type: string
                  format: base64
      responses:
        200:
          description: Classification terminée
          content:
            application/json:
              schema:
                type: object
                properties:
                  category_eee:
                    $ref: '#/components/schemas/EEECategory'
                  confidence:
                    type: number
                  alternatives:
                    type: array
                    items:
                      $ref: '#/components/schemas/EEECategory'

  /cash-sessions:
    get:
      summary: Sessions de caisse
      responses:
        200:
          description: Liste des sessions
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CashSession'
    
    post:
      summary: Ouvrir une session de caisse
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cashier_id:
                  type: string
                opening_amount:
                  type: number
      responses:
        201:
          description: Session ouverte
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CashSession'

  /cash-sessions/{session_id}/close:
    post:
      summary: Fermer une session de caisse
      parameters:
        - name: session_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                actual_amount:
                  type: number
                variance_comment:
                  type: string
      responses:
        200:
          description: Session fermée
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CashSession'

  /sales:
    get:
      summary: Liste des ventes
      responses:
        200:
          description: Liste des ventes
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Sale'
    
    post:
      summary: Enregistrer une vente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SaleCreate'
      responses:
        201:
          description: Vente enregistrée
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Sale'

  /exports/ecologic:
    get:
      summary: Générer export CSV Ecologic
      parameters:
        - name: site_id
          in: query
          required: true
          schema:
            type: string
        - name: period
          in: query
          required: true
          schema:
            type: string
            enum: [daily, weekly, monthly, quarterly]
      responses:
        200:
          description: Export CSV généré
          content:
            text/csv:
              schema:
                type: string

  # Administration Endpoints
  /admin/users:
    get:
      summary: Liste des utilisateurs (Admin)
      description: Récupère la liste paginée des utilisateurs avec filtres optionnels
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: role
          in: query
          required: false
          schema:
            type: string
            enum: [user, cashier, manager, admin, super-admin]
        - name: status
          in: query
          required: false
          schema:
            type: string
            enum: [pending, approved, rejected]
        - name: search
          in: query
          required: false
          schema:
            type: string
            description: Recherche par nom ou email
      responses:
        200:
          description: Liste des utilisateurs récupérée avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: object
                    properties:
                      users:
                        type: array
                        items:
                          $ref: '#/components/schemas/AdminUser'
                      pagination:
                        $ref: '#/components/schemas/PaginationInfo'
                  message:
                    type: string
                  success:
                    type: boolean
        403:
          description: Accès refusé - Rôle insuffisant
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        401:
          description: Non authentifié
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /admin/users/{user_id}/role:
    put:
      summary: Modifier le rôle d'un utilisateur (Admin)
      description: Met à jour le rôle d'un utilisateur spécifique
      security:
        - BearerAuth: []
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
          description: ID de l'utilisateur à modifier
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserRoleUpdate'
      responses:
        200:
          description: Rôle modifié avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/AdminUser'
                  message:
                    type: string
                  success:
                    type: boolean
        400:
          description: Données de requête invalides
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        403:
          description: Accès refusé - Rôle insuffisant
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        404:
          description: Utilisateur non trouvé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        401:
          description: Non authentifié
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        telegram_id:
          type: number
        full_name:
          type: string
        email:
          type: string
          nullable: true
        role:
          type: string
          enum: [user, cashier, manager, admin, super-admin]
        status:
          type: string
          enum: [pending, approved, rejected]
        site_id:
          type: string
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    AdminUser:
      type: object
      properties:
        id:
          type: string
        telegram_id:
          type: number
        full_name:
          type: string
        email:
          type: string
          nullable: true
        role:
          type: string
          enum: [user, cashier, manager, admin, super-admin]
        status:
          type: string
          enum: [pending, approved, rejected]
        site_id:
          type: string
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
          type: string
          enum: [user, cashier, manager, admin, super-admin]
          description: Nouveau rôle à assigner à l'utilisateur

    PaginationInfo:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        limit:
          type: integer
          minimum: 1
        total:
          type: integer
          minimum: 0
        pages:
          type: integer
          minimum: 0
        has_next:
          type: boolean
        has_prev:
          type: boolean

    ErrorResponse:
      type: object
      properties:
        message:
          type: string
        detail:
          type: string
          nullable: true
        success:
          type: boolean
          default: false
    
    EEECategory:
      type: string
      enum: [EEE-1, EEE-2, EEE-3, EEE-4, EEE-5, EEE-6, EEE-7, EEE-8]
    
    Deposit:
      type: object
      properties:
        id:
          type: string
        description:
          type: string
        category_eee:
          $ref: '#/components/schemas/EEECategory'
        quantity:
          type: number
        weight_kg:
          type: number
        ai_confidence:
          type: number
        human_validated:
          type: boolean
    
    DepositCreate:
      type: object
      required: [description, category_eee, quantity, weight_kg]
      properties:
        description:
          type: string
        category_eee:
          $ref: '#/components/schemas/EEECategory'
        quantity:
          type: number
        weight_kg:
          type: number
    
    Sale:
      type: object
      properties:
        id:
          type: string
        category_eee:
          $ref: '#/components/schemas/EEECategory'
        quantity:
          type: number
        unit_price:
          type: number
        total_amount:
          type: number
        payment_method:
          type: string
          enum: [cash, card, check]
    
    SaleCreate:
      type: object
      required: [category_eee, quantity, unit_price, payment_method]
      properties:
        category_eee:
          $ref: '#/components/schemas/EEECategory'
        quantity:
          type: number
        unit_price:
          type: number
        payment_method:
          type: string
          enum: [cash, card, check]
    
    CashSession:
      type: object
      properties:
        id:
          type: string
        cashier_id:
          type: string
        opening_amount:
          type: number
        closing_amount:
          type: number
        actual_amount:
          type: number
        variance:
          type: number
        status:
          type: string
          enum: [opened, closed]

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

---
