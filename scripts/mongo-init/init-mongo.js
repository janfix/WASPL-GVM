// Ce script sera exécuté automatiquement par MongoDB si monté dans /docker-entrypoint-initdb.d/

// Création de l'utilisateur admin avec les droits root sur l'ensemble des bases

db.createUser({
  user: "admin",
  pwd: "password",
  roles: [
    {
      role: "root",
      db: "admin"
    }
  ]
});
