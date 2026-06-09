if (document.getElementById('displayName')) {
  const displayName = document.getElementById('displayName');
  const roomName = document.getElementById('roomName');
  const usePassword = document.getElementById('usePassword');
  const passwordField = document.getElementById('passwordField');
  const nameAvatar = document.getElementById('nameAvatar');
  const createBtn = document.getElementById('createRoomBtn');
  const joinBtn = document.getElementById('joinRoomBtn');
  const errorDiv = document.getElementById('error');

  function updateValidation() {
    const valid = displayName.value.trim() && roomName.value.trim();
    createBtn.disabled = !valid;
    joinBtn.disabled = !valid;
  }

  displayName.addEventListener('input', () => {
    const val = displayName.value.trim();
    if (val) {
      nameAvatar.textContent = getInitials(val);
      nameAvatar.classList.remove('hidden');
    } else {
      nameAvatar.classList.add('hidden');
    }
    errorDiv.classList.add('hidden');
    updateValidation();
  });

  roomName.addEventListener('input', () => {
    errorDiv.classList.add('hidden');
    updateValidation();
  });

  usePassword.addEventListener('change', () => {
    passwordField.classList.toggle('hidden', !usePassword.checked);
  });

  function handleAction() {
    const name = displayName.value.trim();
    const room = roomName.value.trim();
    if (!name || !room) {
      errorDiv.textContent = "Please fill in all required fields";
      errorDiv.classList.remove('hidden');
      return;
    }
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('userInitials', getInitials(name));
    window.location.href = `/teamchat-plus.html?room=${encodeURIComponent(room)}`;
  }

  createBtn.addEventListener('click', handleAction);
  joinBtn.addEventListener('click', handleAction);
}

if (window.location.pathname.includes('teamchat-plus.html')) {
  const name = sessionStorage.getItem('userName');
  if (!name) window.location.href = '/';
}