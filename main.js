// Check auth session on load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log("Logged in as", session.user.email);
    loadNotesFromSupabase();
  }
});

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) alert("Login error: " + error.message);
  else {
    alert("Logged in!");
    loadNotesFromSupabase();
  }
}

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) alert("Signup error: " + error.message);
  else alert("Signup successful! Check your email for confirmation.");
}

async function logout() {
  await supabase.auth.signOut();
  alert("Logged out.");
}

async function loadNotesFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  if (data.length > 0) {
    const latestNote = data[0].content;
    const noteBox = document.querySelector("#noteArea") || document.querySelector("textarea");
    if (noteBox) noteBox.value = latestNote;
  }
}

