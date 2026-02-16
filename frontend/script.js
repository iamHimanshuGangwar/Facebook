let email = document.querySelector("#loginEmail");
let password = document.querySelector("#loginPassword");
let loginbtn = document.querySelector(".login-btn");
let modal = document.querySelector("#signupModal");
let openBtn = document.querySelector("#openModalBtn");
let closeBtn = document.querySelector("#closeModal");
let signupbtn = document.querySelector(".signup-btn");
let checkBtn = document.querySelector("#checkBtn");
let updateSection = document.querySelector("#updateSection");
let updateBtn = document.querySelector("#updateBtn");

//Check if user exists
if (checkBtn) {
  checkBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    let emailField = document.getElementById("email");
    if (!emailField) return;

    let emailValue = emailField.value.trim();

    if (!emailValue) {
      alert("Please enter your email");
      return;
    }

    let res = await fetch("http://localhost:3000/api/user/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailValue }),
    });

    let data = await res.json();

    if (data.message === "User Found") {
      alert("User found. You can now update your details.");
      if (updateSection) updateSection.style.display = "block";
    } else {
      alert("No account found with this email.");
    }
  });
}

//Update user details
if (updateBtn) {
  updateBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let emailField = document.querySelector("#email");
    if (!emailField) return;

    let emailValue = emailField.value.trim();
    let firstname = document.querySelector("#firstname").value.trim();
    let surname = document.querySelector("#surname").value.trim();
    let newPassword = document.querySelector("#password").value.trim();

    if (!firstname || !surname || !newPassword) {
      alert("Please fill all fields");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    let res = await fetch("http://localhost:3000/api/user/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailValue,
        firstname: firstname,
        surname: surname,
        password: newPassword,
      }),
    });

    let data = await res.json();
    alert(data.message);

    if (data.message === "Data Updated") {
      window.location.href = "index.html";
    }
  });
}

//Signup code
signupbtn.addEventListener("click", async (e) => {
  e.preventDefault();

  let firstname = document.querySelector("#firstName").value;
  let surname = document.querySelector("#surName").value;
  let signupEmail = document.querySelector("#signupEmail").value;
  let signupPassword = document.querySelector("#signupPassword").value;

  let bd = {
    firstname: firstname,
    surname: surname,
    email: signupEmail,
    password: signupPassword,
  };

  if (!bd.firstname || !bd.surname || !bd.email || !bd.password) {
    alert("Please fill all the fields");
    return;
  }

  let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  if (!emailPattern.test(bd.email)) {
    alert("Invalid email format!");
    return;
  }

  if (bd.password.length < 6) {
    alert("Password must be at least 6 characters!");
    return;
  }

  fetch("http://localhost:3000/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bd),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      if (data.message === "User Registered Successfully") {
        modal.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

// Modal open/close
openBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Login code
loginbtn.addEventListener("click", async (e) => {
  e.preventDefault();
  let bd = { email: email.value, password: password.value };

  if (!bd.email || !bd.password) {
    alert("Please fill all the fields");
    return;
  }

  let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  if (!emailPattern.test(bd.email)) {
    alert("Invalid email format!");
    return;
  }

  if (bd.password.length < 6) {
    alert("Password must be at least 6 characters!");
    return;
  }
  fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bd),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Success") {
        localStorage.setItem("mytoken", data.token);
        location.href = "welcome.html";
      } else {
        alert("Login failed: " + data.message);
      }
    });
});
