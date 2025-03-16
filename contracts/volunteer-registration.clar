;; Volunteer Registration Contract
;; Manages volunteer identities and skills

;; Define error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_REGISTERED u2)
(define-constant ERR_NOT_FOUND u3)

;; Define volunteer status
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_INACTIVE u2)

;; Define data structure for volunteer registration
(define-map volunteers
  {id: uint}
  {
    principal: principal,
    name: (string-utf8 50),
    skills: (string-utf8 100),
    status: uint
  }
)

;; Map principal to volunteer ID
(define-map principal-to-id principal uint)

;; Track volunteer count
(define-data-var volunteer-count uint u0)

;; Admin principal
(define-data-var admin principal tx-sender)

;; Register as a volunteer
(define-public (register-volunteer
                (name (string-utf8 50))
                (skills (string-utf8 100)))
  (let ((id (+ (var-get volunteer-count) u1)))

    ;; Check if already registered
    (asserts! (is-none (map-get? principal-to-id tx-sender))
              (err ERR_ALREADY_REGISTERED))

    ;; Store volunteer data
    (map-set volunteers
             {id: id}
             {
               principal: tx-sender,
               name: name,
               skills: skills,
               status: STATUS_ACTIVE
             })

    ;; Map principal to volunteer ID
    (map-set principal-to-id tx-sender id)

    ;; Increment volunteer count
    (var-set volunteer-count id)

    (ok id)))

;; Update volunteer status (admin only)
(define-public (update-status
                (id uint)
                (status uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some (map-get? volunteers {id: id})) (err ERR_NOT_FOUND))

    (match (map-get? volunteers {id: id})
      volunteer
      (ok (map-set volunteers
                   {id: id}
                   (merge volunteer {status: status})))
      (err ERR_NOT_FOUND))))

;; Update volunteer skills
(define-public (update-skills
                (skills (string-utf8 100)))
  (let ((id (default-to u0 (map-get? principal-to-id tx-sender))))
    (asserts! (> id u0) (err ERR_NOT_FOUND))

    (match (map-get? volunteers {id: id})
      volunteer
      (ok (map-set volunteers
                   {id: id}
                   (merge volunteer {skills: skills})))
      (err ERR_NOT_FOUND))))

;; Get volunteer details
(define-read-only (get-volunteer (id uint))
  (map-get? volunteers {id: id}))

;; Get volunteer ID by principal
(define-read-only (get-id (volunteer-principal principal))
  (map-get? principal-to-id volunteer-principal))

;; Check if volunteer is active
(define-read-only (is-active (id uint))
  (match (map-get? volunteers {id: id})
    volunteer (is-eq (get status volunteer) STATUS_ACTIVE)
    false))

;; Get total volunteer count
(define-read-only (get-count)
  (var-get volunteer-count))
