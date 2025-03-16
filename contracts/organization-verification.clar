;; Organization Verification Contract
;; Validates legitimate volunteer opportunities

;; Define error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_REGISTERED u2)
(define-constant ERR_NOT_FOUND u3)

;; Define organization status
(define-constant STATUS_PENDING u1)
(define-constant STATUS_VERIFIED u2)
(define-constant STATUS_REJECTED u3)

;; Define data structure for organization registration
(define-map organizations
  {id: uint}
  {
    principal: principal,
    name: (string-utf8 50),
    description: (string-utf8 100),
    status: uint
  }
)

;; Map principal to organization ID
(define-map principal-to-id principal uint)

;; Track organization count
(define-data-var org-count uint u0)

;; Admin principal
(define-data-var admin principal tx-sender)

;; Verifiers who can approve organizations
(define-map verifiers principal bool)

;; Add a verifier (admin only)
(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (ok (map-set verifiers verifier true))))

;; Register as an organization
(define-public (register-organization
                (name (string-utf8 50))
                (description (string-utf8 100)))
  (let ((id (+ (var-get org-count) u1)))

    ;; Check if already registered
    (asserts! (is-none (map-get? principal-to-id tx-sender))
              (err ERR_ALREADY_REGISTERED))

    ;; Store organization data
    (map-set organizations
             {id: id}
             {
               principal: tx-sender,
               name: name,
               description: description,
               status: STATUS_PENDING
             })

    ;; Map principal to organization ID
    (map-set principal-to-id tx-sender id)

    ;; Increment organization count
    (var-set org-count id)

    (ok id)))

;; Verify organization (verifier only)
(define-public (verify-organization
                (id uint)
                (status uint))
  (begin
    (asserts! (default-to false (map-get? verifiers tx-sender)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some (map-get? organizations {id: id})) (err ERR_NOT_FOUND))

    (match (map-get? organizations {id: id})
      org
      (ok (map-set organizations
                   {id: id}
                   (merge org {status: status})))
      (err ERR_NOT_FOUND))))

;; Get organization details
(define-read-only (get-organization (id uint))
  (map-get? organizations {id: id}))

;; Get organization ID by principal
(define-read-only (get-id (org-principal principal))
  (map-get? principal-to-id org-principal))

;; Check if organization is verified
(define-read-only (is-verified (id uint))
  (match (map-get? organizations {id: id})
    org (is-eq (get status org) STATUS_VERIFIED)
    false))

;; Get total organization count
(define-read-only (get-count)
  (var-get org-count))
