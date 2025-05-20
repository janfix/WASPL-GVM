<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <img src="../assets/waspl.png" width="30px" style="margin-right: 10px;">
      <router-link class="navbar-brand" to="/">
        
      </router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
      
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/about">About</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style focused>
.navbar {
  background-color: #F8F9FA;
  color: white;
  position: fixed!important;
  top: 0;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@media (max-width: 991.98px) { /* correspond à lg en Bootstrap */
  .navbar {
    text-align: right;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    z-index: 1;
  }

  .navbar .nav-link {
    font-weight: bold;
    font-size: 1.1rem;
    color: #333 !important;
    background-color: #F8F9FA!important;
  }

  .navbar-toggler {
    border: none;
    padding: 0.5rem;
  }

  .navbar-toggler-icon {
    background-image: url("your-custom-icon.svg"); /* optionnel */
  }
}

</style>
