<template>
    <BNavbar variant="success" bg="info" class="Waspl-bar">
        <BNavbarBrand style="color:azure" href="#">
            <div class="logoSlog">
                <img width="100px" src="../assets/WASPLlogo.png">
                <span class="slog">The easy way</span>
            </div>
        </BNavbarBrand>
   
        <div class="WasplConnect">

            <div v-if="userStore.user" class="helloUser">
                Hello {{ userStore.user.firstname }} {{ userStore.user.lastname }} - {{ userStore.user.username }}
            </div>
            <div class="dropdown text-end waspluser">
                <a href="#" class="d-block link-dark text-decoration-none dropdown-toggle" id="dropdownUser1"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    <font-awesome-icon :icon="['fas', 'circle-user']" class="topBarIcon" />
                </a>
                <ul class="dropdown-menu text-small" aria-labelledby="dropdownUser1" style="">
                    <li hidden><a class="dropdown-item" href="#">Settings</a></li>
                    <li><a class="dropdown-item" @click="profileModal.openModal" href="#">Profile</a></li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a @click="logout" class="dropdown-item" href="#">Sign out</a></li>
                </ul>
            </div>

        </div>
    </BNavbar>
    <ProfileModal ref="profileModal" />
</template>


<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import ProfileModal from '@/components/ProfileModal.vue';

const router = useRouter();
const userStore = useUserStore();
const profileModal = ref(null);

const logout = () => {
    userStore.logout();
    localStorage.removeItem('editortoken')
    router.push('/login')
}
</script>


<style scoped>
.parameters {
    font-size: 24px;
    color: white;
}

.Waspl-bar {
    padding-top: 25px;
    color: white;
    height:100px;
}

.topBarIcon {
    color: white;
    font-size: 1.5em;
    margin-left: 10px
}

.WasplConnect {
    inset: 0px auto auto 0px;
    margin-top: 25px;
}

.dropdown-menu.show {
    display: block;
}

.text-small {
    font-size: 85%;
}

.shadow {
    box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15) !important;
}

.dropdown-menu {

    position: absolute;
    z-index: 1000;
    display: none;
    min-width: 10rem;
    padding: .5rem 0;
    margin: 0px -100px;
    font-size: 1rem;
    color: #212529;
    text-align: left;
    list-style: none;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid rgba(0, 0, 0, .15);
    border-radius: .25rem;
}

.logoSlog {
    padding: 20px;
    margin-top: -20px;
    margin-left: 10px;
}

.slog {
    position: absolute;
    font-size: 0.8em;
    font-style: italic;
    margin-top: 27px;
    margin-left: 0px;
}


.helloUser {
    right: 20px;
    top: 20px;
    position: absolute;
    text-align: left;
}

.dropdown-toggle::after {
    color: white
}

.waspluser{
    margin-top: -20px;
    margin-right: 10px;
}

</style>