// Funzione che prende i dati dal form e controlla se le password coincidono
// Se sì, mostra nome, cognome, email e numero con un alert
// Se no, mostra un alert "cattivo" giusto per ridere
function visualizza_messaggio() {
  var nome = document.getElementById("nome").value;
  var cognome = document.getElementById("cognome").value;
  var email = document.getElementById("email").value;
  var numero = document.getElementById("numero").value;
  var password1 = document.getElementById("password1").value;
  var password2 = document.getElementById("password2").value;

  if (password1 == password2) {
    alert(nome + "  " + cognome + "  " + email + "  " + numero);
  } else {
    alert("La via è chiusa... ORA DEVI MORIRE!");
  }
}

// Controllo che il DOM sia pronto prima di lanciare le funzioni
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ready);
} else {
  ready();
}

// Salva il carrello nello storage del browser (così rimane anche se aggiorni la pagina)
function saveCartToStorage() {
  localStorage.setItem('cart', document.querySelector('.cart-items').innerHTML);
  localStorage.setItem('cartTotal', document.querySelector('.cart-total-price').innerText);

  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(button => {
    const title = button.getAttribute('data-title');
    const sessionCount = button.getAttribute('data-sessioncount');
    localStorage.setItem(`sessioncount-${title}`, sessionCount);
  });
}

// Carica i dati del carrello dallo storage locale
// Ripristina anche i bottoni e le quantità
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  const savedTotal = localStorage.getItem('cartTotal');
  if (savedCart) {
    document.querySelector('.cart-items').innerHTML = savedCart;
    document.querySelector('.cart-total-price').innerText = savedTotal;

    const removeButtons = document.getElementsByClassName('btn-danger');
    for (let btn of removeButtons) {
      btn.addEventListener('click', removeCartItem);
    }

    const quantityInputs = document.getElementsByClassName('cart-quantity-input');
    for (let input of quantityInputs) {
      input.addEventListener('change', quantityChanged);
    }
  }

  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(button => {
    const title = button.getAttribute('data-title');
    const savedCount = localStorage.getItem(`sessioncount-${title}`);
    if (savedCount !== null) {
      button.setAttribute('data-sessioncount', savedCount);

      const stockDisplay = button.closest('.card').querySelector('.stock-num');
      const sessionLimit = parseInt(button.getAttribute('data-sessionlimit')) || parseInt(button.getAttribute('data-stock'));
      const remaining = sessionLimit - parseInt(savedCount);

      if (stockDisplay) {
        stockDisplay.innerText = remaining > 0 ? remaining : 'Esaurito';
      }

      if (remaining <= 0) {
        button.disabled = true;
        button.textContent = 'ESAURITO';
      }
    }
  });
}

// Funzione che inizializza gli event listener quando la pagina è pronta
function ready() {
  loadCartFromStorage();

  const removeButtons = document.getElementsByClassName('btn-danger');
  for (let btn of removeButtons) {
    btn.addEventListener('click', removeCartItem);
  }

  const quantityInputs = document.getElementsByClassName('cart-quantity-input');
  for (let input of quantityInputs) {
    input.addEventListener('change', quantityChanged);
  }

  const addToCartButtons = document.getElementsByClassName('add-to-cart');
  for (let button of addToCartButtons) {
    button.addEventListener('click', addToCartClicked);
  }

  const purchaseButton = document.querySelector('.btn-purchase');
  if (purchaseButton) {
    purchaseButton.addEventListener('click', purchaseClicked);
  }
}

// Quando clicchi "Acquista": se il carrello è vuoto apre un modal
// Se invece ci sono prodotti, mostra il modal di conferma, svuota il carrello e lo storage
function purchaseClicked() {
  const cartItems = document.querySelector('.cart-items');
  if (cartItems.children.length === 0) {
    const modal = new bootstrap.Modal(document.getElementById('empityModal'));
    modal.show();
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('purchaseModal'));
  modal.show();
  while (cartItems.firstChild) {
    cartItems.removeChild(cartItems.firstChild);
  }
  localStorage.clear();
  updateCartTotal();
}

// Rimuove un elemento dal carrello e aggiorna le quantità disponibili
function removeCartItem(event) {
  const row = event.target.closest('tr');
  const title = row.querySelector('.cart-item-title').innerText;
  const quantity = parseInt(row.querySelector('.cart-quantity-input').value);
  const button = Array.from(document.getElementsByClassName('add-to-cart')).find(btn => btn.getAttribute('data-title') === title);

  if (button) {
    let sessionCount = parseInt(button.getAttribute('data-sessioncount')) || 0;
    let sessionLimit = parseInt(button.getAttribute('data-sessionlimit')) || 1;
    sessionCount = Math.max(0, sessionCount - quantity);
    button.setAttribute('data-sessioncount', sessionCount);

    const stockDisplay = button.closest('.card').querySelector('.stock-num');
    const remaining = sessionLimit - sessionCount;
    if (stockDisplay) {
      stockDisplay.innerText = remaining > 0 ? remaining : 'Esaurito';
    }

    if (remaining > 0) {
      button.disabled = false;
      button.textContent = 'Aggiungi';
    }
  }

  row.remove();
  updateCartTotal();
  saveCartToStorage();
}

// Gestisce il cambio quantità direttamente da input
function quantityChanged(event) {
  const input = event.target;
  const row = input.closest('tr');
  const title = row.querySelector('.cart-item-title').innerText;
  const button = Array.from(document.getElementsByClassName('add-to-cart')).find(btn => btn.getAttribute('data-title') === title);
  const sessionLimit = parseInt(button.getAttribute('data-sessionlimit')) || 0;
  const previousQuantity = parseInt(input.getAttribute('data-prev')) || 1;
  let newQuantity = parseInt(input.value);

  if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
  if (newQuantity > sessionLimit) newQuantity = sessionLimit;

  input.value = newQuantity;
  input.setAttribute('data-prev', newQuantity);

  button.setAttribute('data-sessioncount', newQuantity);

  const stockDisplay = button.closest('.card').querySelector('.stock-num');
  const remaining = sessionLimit - newQuantity;
  if (stockDisplay) {
    stockDisplay.innerText = remaining > 0 ? remaining : 'Esaurito';
  }
  if (remaining <= 0) {
    button.disabled = true;
    button.textContent = 'ESAURITO';
  } else {
    button.disabled = false;
    button.textContent = 'Aggiungi';
  }

  updateCartTotal();
  saveCartToStorage();
}

// Aggiunge un prodotto al carrello (quando clicchi sul bottone "Aggiungi")
function addToCartClicked(event) {
  const button = event.target;
  const title = button.getAttribute('data-title');
  const price = parseFloat(button.getAttribute('data-price'));
  const image = button.getAttribute('data-img');

  let stock = parseInt(button.getAttribute('data-stock')) || 0;
  let sessionLimit = parseInt(button.getAttribute('data-sessionlimit')) || stock;
  let sessionCount = parseInt(button.getAttribute('data-sessioncount')) || 0;

  if (sessionCount >= sessionLimit) {
    alert('Limite raggiunto per questo prodotto!');
    return;
  }

  sessionCount++;
  button.setAttribute('data-sessioncount', sessionCount);

  const stockDisplay = button.closest('.card').querySelector('.stock-num');
  if (stockDisplay) {
    stockDisplay.innerText = sessionLimit - sessionCount > 0 ? (sessionLimit - sessionCount) : 'Esaurito';
  }

  const cartItems = document.querySelector('.cart-items');
  const existingRow = Array.from(cartItems.children).find(row => {
    const itemTitle = row.querySelector('.cart-item-title');
    const itemPrice = row.querySelector('.cart-price');
    return itemTitle && itemTitle.innerText === title && itemPrice && parseFloat(itemPrice.innerText) === price;
  });

  if (existingRow) {
    const quantityInput = existingRow.querySelector('.cart-quantity-input');
    let current = parseInt(quantityInput.value);
    if (current < sessionLimit) {
      quantityInput.value = current + 1;
      quantityInput.setAttribute('data-prev', current + 1);
    }
  } else {
    addItemToCart(title, price, image, button);
  }

  updateCartTotal();
  saveCartToStorage();

  if (sessionCount >= sessionLimit) {
    button.disabled = true;
    button.textContent = 'ESAURITO';
  }
}

// Crea la riga del prodotto dentro la tabella del carrello
function addItemToCart(title, price, image, button) {
  const cartRow = document.createElement('tr');
  const sessionLimit = parseInt(button.getAttribute('data-sessionlimit')) || 1;

  cartRow.innerHTML = `
    <td><img src="${image}" width="50"> <span class="cart-item-title">${title}</span></td>
    <td>€ <span class="cart-price">${price.toFixed(2)}</span></td>
    <td>
      <input class="cart-quantity-input" type="number" value="1" min="1" max="${sessionLimit}" data-prev="1" style="width:50px;">
      <button class="btn btn-danger" style="margin-left:10px;">Rimuovi</button>
    </td>
  `;

  const cartItems = document.querySelector('.cart-items');
  cartItems.appendChild(cartRow);

  cartRow.querySelector('.btn-danger').addEventListener('click', removeCartItem);
  cartRow.querySelector('.cart-quantity-input').addEventListener('change', quantityChanged);
}

// Aggiorna il totale del carrello
function updateCartTotal() {
  const cartRows = document.querySelectorAll('.cart-items tr');
  let total = 0;
  for (let row of cartRows) {
    const price = parseFloat(row.querySelector('.cart-price').innerText);
    const quantity = parseInt(row.querySelector('.cart-quantity-input').value);
    total += price * quantity;
  }
  total = Math.round(total * 100) / 100;
  document.querySelector('.cart-total-price').innerText = '€ ' + total;
}

// Inizializza anche MixItUp per i filtri sulle card
let mixer;
document.addEventListener('DOMContentLoaded', function () {
  mixer = mixitup('.container-card', {
    selectors: {
      target: '.mix'
    },
    animation: {
      duration: 300
    }
  });

  // Aggiungo l'evento ai bottoni dei filtri
  const buttons = document.querySelectorAll('[data-filter]');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const filterValue = button.getAttribute('data-filter');
      mixer.filter(filterValue);
    });
  });
});
