(() => {
  const refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };
  refreshIcons();
  const api = document.body.dataset.authUrl;
  if(api&&document.querySelector('[data-auth-form]'))CLA.auth('me').then(result=>{if(result.user)location.replace(result.user.role+'.html')}).catch(()=>{});
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.innerHTML = '<i data-lucide="' + (open ? 'x' : 'menu') + '"></i>';
      refreshIcons();
    });
  }
  document.querySelectorAll('.main-nav a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) { menuButton.innerHTML = '<i data-lucide="menu"></i>'; refreshIcons(); }
    history.replaceState(null, '', link.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      button.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '"></i>';
      refreshIcons();
    });
  });
  document.querySelectorAll('[data-auth-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const message = form.querySelector('.form-message');
      const submit = form.querySelector('[type="submit"]');
      message.textContent = 'Please wait…';
      message.classList.remove('error');
      submit.disabled = true;
      form.setAttribute('aria-busy','true');
      try {
        const data=Object.fromEntries(new FormData(form));
        const result=await CLA.auth(data.action,data);
        message.textContent = result.message || 'Unable to complete the request.';
        message.classList.toggle('error', !result.ok);
        if(result.ok){window.setTimeout(()=>{window.location.href=result.user?.role==='admin'?'admin.html':'user.html'},350)}
      } catch(error) {
        message.textContent=error.message||'Could not reach the server. Open this site through XAMPP at http://localhost/CyberLawAssist/.';
        message.classList.add('error');
      } finally {
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  });
  document.querySelectorAll('[data-notice]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const message = link.closest('.auth-card')?.querySelector('.form-message');
      if (message) { message.textContent = link.dataset.notice; message.classList.remove('error'); }
    });
  });
  if (api && nav && document.body.dataset.home === 'true') {
    CLA.auth('me').then(result => {
        if(!result.user)return;
        nav.querySelector('.nav-login')?.remove();
        CLA.bindAccount(result.user.id);
        nav.querySelector('.nav-signup')?.remove();
        const account = document.createElement('span');
        account.className = 'nav-account';
        account.textContent = result.user.name.split(' ')[0];
        const logout = document.createElement('button');
        logout.className = 'nav-logout';
        logout.type = 'button';
        logout.textContent = 'Log out';
        logout.addEventListener('click', async () => {
          try{await CLA.auth('logout',{})}catch(error){logout.textContent=error.message;return}
          window.location.reload();
        });
        const guestLink=nav.querySelector('a[href="pages/guest.html"]');if(guestLink)guestLink.textContent='My workspace';
        document.querySelectorAll('a[href^="pages/guest"]').forEach(link=>{link.setAttribute('href',link.getAttribute('href').replace(/^pages\/guest/,'pages/'+result.user.role))});
        nav.append(account,logout);
      }).catch(() => {});
  }
})();
