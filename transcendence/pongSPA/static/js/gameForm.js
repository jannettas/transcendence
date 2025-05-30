import { logger, showModal } from "./app.js";
import { startGameSetup } from "./pong.js";
import { checkPlayerExists, checkUserExists, handleError, updatePlayerStatus } from "./tournament.js";
import { sanitizeAdvanced, sanitizeHTML } from "./utils.js";

let gameSettings = null;

export function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    (window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
  );
}

export function displayGameForm() {
  let players = new Map();

  const isMobile = isMobileDevice();

  // Vide tous les conteneurs
  document.getElementById('app_top').innerHTML = '';
  document.getElementById('app_main').innerHTML = '';
  document.getElementById('app_bottom').innerHTML = '';

  localStorage.setItem("isTournamentMatch", false);
  const formContainer = document.getElementById("app_main");
  const username = localStorage.getItem("username");

  gameSettings = {
    mode: "solo",
    difficulty: "easy",
    design: "retro",
    numberOfGames: 1, // entre 1 et 5
    setsPerGame: 3, // entre 1 et 5
    player1: username || "Player1", // Sécurité si username est null
    player2: "Bot-AI", // Valeur initiale pour mode solo
    control1: isMobile ? "touch" : "arrows", // Sur mobile, utiliser le tactile par défaut
    control2: "wasd",
    isTournamentMatch: false,
    isAIActive: true,
    soundEnabled: false
  };

  // Insertion du formulaire HTML
  formContainer.innerHTML = `
    <form id="gameForm" class="container w-100">
      <ul class="nav nav-pills nav-justified mb-3 d-flex flex-wrap" id="pills-tab" role="tablist">
        <li class="nav-item flex-grow-1" role="presentation">
          <button class="nav-link active border border-primary rounded-0 bg-transparent" id="pills-game-settings-tab"
            data-bs-toggle="pill" data-bs-target="#pills-game-settings" type="button" role="tab"
            aria-controls="pills-game-settings" aria-selected="true">${i18next.t('game.gameSettings')}</button>
        </li>
        <li class="nav-item flex-grow-1" role="presentation">
          <button class="nav-link border border-primary rounded-0 bg-transparent" id="pills-player-settings-tab"
            data-bs-toggle="pill" data-bs-target="#pills-player-settings" type="button" role="tab"
            aria-controls="pills-player-settings" aria-selected="false">${i18next.t('game.playerSettings')}</button>
        </li>
        <li class="nav-item flex-grow-1" role="presentation">
          <button class="nav-link border border-primary rounded-0 bg-transparent" id="pills-match-settings-tab"
            data-bs-toggle="pill" data-bs-target="#pills-match-settings" type="button" role="tab"
            aria-controls="pills-match-settings" aria-selected="false">${i18next.t('game.matchSettings')}</button>
        </li>
      </ul>

      <div class="tab-content" id="pills-tabContent">
        <div class="tab-pane fade show active" id="pills-game-settings" role="tabpanel" aria-labelledby="pills-game-settings-tab">
          <div class="d-flex justify-content-center mt-3">
            <div class="col-12 p-3 d-flex flex-column">
              <h3 class="text-center p-2" style="font-family: 'Press Start 2P', cursive; font-size: 24px;">${i18next.t('game.gameSettings')}</h3>
              <div class="border border-primary rounded p-3 flex-grow-1 d-flex flex-column justify-content-between bg-transparent">
                <!-- Paramètre: Mode de jeu -->
                <div class="mb-3">
                  <label class="form-label d-block" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">${i18next.t('game.gameMode')}:</label>
                  <div class="d-flex flex-wrap gap-2">
                    <!-- Sur mobile, classe w-100 pour utiliser toute la largeur disponible -->
                    <button id="onePlayer" class="mode-button btn btn-primary ${isMobile ? 'w-100' : 'flex-grow-1'}" type="button">${i18next.t('game.onePlayer')}</button>
                    ${!isMobile ? `<button id="twoPlayers" class="mode-button btn btn-outline-primary flex-grow-1" type="button">${i18next.t('game.twoPlayers')}</button>` : ''}
                  </div>
                </div>
                
                <!-- Paramètre: Difficulté -->
                <div class="mb-3">
                  <label class="form-label d-block" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">${i18next.t('game.difficulty')}:</label>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="difficulty-button btn ${gameSettings.difficulty === "easy" ? "btn-primary" : "btn-outline-primary"} flex-grow-1" id="easy" type="button">${i18next.t('game.easy')}</button>
                    <button class="difficulty-button btn ${gameSettings.difficulty === "medium" ? "btn-primary" : "btn-outline-primary"} flex-grow-1" id="medium" type="button">${i18next.t('game.medium')}</button>
                    <button class="difficulty-button btn ${gameSettings.difficulty === "hard" ? "btn-primary" : "btn-outline-primary"} flex-grow-1" id="hard" type="button">${i18next.t('game.hard')}</button>
                  </div>
                </div>
                
                <!-- Paramètre: Design -->
                <div class="mb-3">
                  <label class="form-label d-block" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">${i18next.t('game.design')}:</label>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="design-button btn ${gameSettings.design === "retro" ? "btn-primary" : "btn-outline-primary"} flex-grow-1" id="retro" type="button">${i18next.t('game.retro')}</button>
                    <button class="design-button btn ${gameSettings.design === "neon" ? "btn-primary" : "btn-outline-primary"} flex-grow-1" id="neon" type="button">${i18next.t('game.neon')}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-pane fade" id="pills-player-settings" role="tabpanel" aria-labelledby="pills-player-settings-tab">
          <div class="row mt-3" id="player-container">
            <!-- Joueur 1 -->
            <div class="col-12 col-md-6 mb-3 mb-md-0">
              <div class="d-flex flex-column h-100">
                <h3 class="text-center p-2" style="font-family: 'Press Start 2P', cursive; font-size: 24px;">${i18next.t('game.player')} 1</h3>
                <div class="border border-primary rounded p-3 flex-grow-1 d-flex flex-column justify-content-between bg-transparent">
                  <div class="mb-3">
                    <label for="player1" style="font-family: 'Press Start 2P', cursive; font-size: 15px;" class="form-label">${i18next.t('game.name')}:</label>
                    <input type="text" id="player1" value="${gameSettings.player1}" style="font-family: 'Press Start 2P', cursive; font-size: 15px;" class="form-control bg-transparent" disabled>
                  </div>
                  <div class="mb-3">
                    <label for="control1" style="font-family: 'Press Start 2P', cursive; font-size: 15px;" class="form-label">${i18next.t('game.control')}:</label>
                    ${isMobile ? 
                      `<div class="form-control bg-transparent" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">
                        ${i18next.t('game.touchButtons') || 'Touch Controls'}
                      </div>
                      <input type="hidden" id="control1" value="touch">` 
                    : 
                    `<select id="control1" class="form-select bg-transparent">
                      <option style="font-family: 'Press Start 2P', cursive; font-size: 15px;" value="arrows" ${gameSettings.control1 === "arrows" ? "selected" : ""}>${i18next.t('game.arrowKeys')}</option>
                      <option style="font-family: 'Press Start 2P', cursive; font-size: 15px;" value="wasd" ${gameSettings.control1 === "wasd" ? "selected" : ""}>WASD</option>
                      <option style="font-family: 'Press Start 2P', cursive; font-size: 15px;" value="mouse" ${gameSettings.control1 === "mouse" ? "selected" : ""}>${i18next.t('game.mouse')}</option>
                    </select>`
                    }
                  </div>
                </div>
              </div>
            </div>      
            <!-- Joueur 2 -->
            <div class="col-12 col-md-6">
              <div class="d-flex flex-column h-100">
                <h3 class="text-center p-2" style="font-family: 'Press Start 2P', cursive; font-size: 24px;">${i18next.t('game.player')} 2</h3>
                <div class="border border-primary rounded p-3 flex-grow-1 d-flex flex-column justify-content-between bg-transparent player2-container">
                  <div class="mb-3">
                    <label for="player2" class="form-label" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">${i18next.t('game.name')}:</label>
                    <input type="text" id="player2" value="${gameSettings.player2}" class="form-control bg-transparent" style="font-family: 'Press Start 2P', cursive; font-size: 15px;" ${gameSettings.mode === "solo" ? "disabled" : ""}>
                    <span class="status-text ms-2" style="display: ${gameSettings.mode === "solo" ? 'none' : 'block'};"></span>
                  </div>
                  <div id="control2Container" class="mb-3" style="${gameSettings.mode === "solo" ? "display:none;" : "display:block;"}">
                    <label for="control2" style="font-family: 'Press Start 2P', cursive; font-size: 15px;" class="form-label">${i18next.t('game.control')}:</label>
                    <select id="control2" class="form-select bg-transparent">
                      <option value="wasd" ${gameSettings.control2 === "wasd" ? "selected" : ""}>WASD</option>
                      <option value="arrows" ${gameSettings.control2 === "arrows" ? "selected" : ""}>${i18next.t('game.arrowKeys')}</option>
                      <option value="mouse" ${gameSettings.control2 === "mouse" ? "selected" : ""}>${i18next.t('game.mouse')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-pane fade" id="pills-match-settings" role="tabpanel" aria-labelledby="pills-match-settings-tab">
          <div class="d-flex justify-content-center mt-3">
            <div class="col-12 p-3 d-flex flex-column">
              <h3 class="text-center p-2" style="font-family: 'Press Start 2P', cursive; font-size: 24px;">${i18next.t('game.matchSettings')}</h3>
              <div class="border border-primary rounded p-3 flex-grow-1 d-flex flex-column justify-content-between bg-transparent">
                <div class="row mb-3 align-items-center">
                  <div class="col-7">
                    <label for="numberOfGames" class="form-label mb-0" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">${i18next.t('game.setsPerGame')}:</label>
                  </div>
                  <div class="col-5">
                    <input type="number" id="numberOfGames" value="${gameSettings.numberOfGames}" min="1" max="5" class="form-control bg-transparent" style="width: 60px;">
                  </div>
                </div>
                <div class="row align-items-center">
                  <div class="col-7">
                    <label for="setsPerGame" class="form-label mb-0" style="font-family: 'Press Start 2P', cursive; font-size: 15px;">${i18next.t('game.pointsToWin')}:</label>
                  </div>
                  <div class="col-5">
                    <input type="number" id="setsPerGame" value="${gameSettings.setsPerGame}" min="1" max="5" class="form-control bg-transparent" style="width: 60px;">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>

  <div class="mt-4">
  <!-- Bouton de son placé au-dessus, aligné à droite -->
  <div class="d-flex justify-content-end mb-3">
    <button id="toggleSoundButton" class="btn btn-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; padding: 0;">
      <i class="bi bi-volume-mute-fill" style="font-size: 1.5rem;"></i>
    </button>
  </div>
  
  <!-- Bouton démarrer placé en dessous, centré -->
  <div class="text-center">
    <button id="startGameButton" class="btn btn-success btn-lg px-4 py-2" type="button">${i18next.t('game.startGame')}</button>
  </div>
</div>

<div id="result" style="display: none;">
  <h2>${i18next.t('game.gameResults')}</h2>
  <p id="summary"></p>
</div>
  `;

  const playerContainer = document.getElementById('player-container');
  const player2Container = document.querySelector('.player2-container');
  if (player2Container) {
    const player2Input = player2Container.querySelector('#player2');
    player2Input.addEventListener('blur', async (event) => {
      logger.log("Blur déclenché sur player2, mode actuel:", gameSettings.mode);
      if (gameSettings.mode === "multiplayer" && event.target.tagName === 'INPUT') {
        const playerDiv = event.target.closest('div');
        const playerName = playerDiv.querySelector('input').value.trim().toLowerCase();
        const statusText = playerDiv.querySelector('.status-text');

        logger.log("Vérification du joueur:", playerName);
        if (!playerName || (players.has(playerName) && players.get(playerName).validated)) {
          if (players.has(playerName) && players.get(playerName).validated) {
            logger.log("Joueur déjà validé:", playerName);
            const modal = new bootstrap.Modal(document.getElementById('duplicatePlayerModal'));
            modal.show();
          }
          return;
        }

        try {
          cleanupPlayersMap(playerContainer, players);
          const userData = await checkUserExists(playerName);

          if (userData.exists) {
            logger.log("Utilisateur existant détecté:", userData);
            updatePlayerStatus(playerDiv, userData);
            statusText.textContent = i18next.t('game.existingPlayerNeedsAuth');
            statusText.className = 'status-text text-warning ms-2';
            players.set(playerName, { validated: true, div: playerDiv });
          } else {
            const playerData = await checkPlayerExists(playerName);
            if (playerData.exists) {
              logger.log("Joueur invité existant:", playerData);
              updatePlayerStatus(playerDiv, { exists: true, is_guest: true });
              statusText.textContent = i18next.t('game.existingGuestPlayer');
              statusText.className = 'status-text text-info ms-2';
            } else {
              logger.log("Nouveau joueur invité:", playerName);
              updatePlayerStatus(playerDiv, { exists: false, is_guest: true });
              statusText.textContent = i18next.t('game.newGuestPlayer');
              statusText.className = 'status-text text-success ms-2';
            }
            players.set(playerName, { validated: true, div: playerDiv });
          }
        } catch (error) {
          logger.error("Erreur lors de la vérification du joueur:", error);
          statusText.textContent = i18next.t('game.errorCheckingPlayer');
          statusText.className = 'status-text text-danger ms-2';
        }
      }
    }, true);
  }

  function toggleActiveButton(group, selectedId) {
    document.querySelectorAll(group).forEach(button => {
      button.classList.remove('btn-primary');
      button.classList.add('btn-outline-primary');
    });
    const selectedButton = document.getElementById(selectedId);
    if (selectedButton) {
      selectedButton.classList.remove('btn-outline-primary');
      selectedButton.classList.add('btn-primary');
    }
  }

  // Fonctions de gestion des boutons
  function handleDifficultyButtonClick(buttonId) {
    gameSettings.difficulty = buttonId;
    toggleActiveButton(".difficulty-button", buttonId);
  }

  function handleDesignButtonClick(buttonId) {
    gameSettings.design = buttonId;
    toggleActiveButton(".design-button", buttonId);
  }

  // Écouteurs d'événements conditionnels selon le type d'appareil
  if (isMobile) {
    // Sur mobile
    document.querySelectorAll(".difficulty-button").forEach(button => {
      button.addEventListener("touchend", function(e) {
        e.preventDefault();
        handleDifficultyButtonClick(this.id);
      }, { passive: false });
    });
    
    document.querySelectorAll(".design-button").forEach(button => {
      button.addEventListener("touchend", function(e) {
        e.preventDefault();
        handleDesignButtonClick(this.id);
      }, { passive: false });
    });
    
    const onePlayerBtn = document.getElementById("onePlayer");
    if (onePlayerBtn) {
      onePlayerBtn.addEventListener("touchend", function(e) {
        e.preventDefault();
        onePlayerButtonClick();
      }, { passive: false });
    }
  } else {
    // Sur desktop
    document.querySelectorAll(".difficulty-button").forEach(button => {
      button.addEventListener("click", function() {
        handleDifficultyButtonClick(this.id);
      });
    });
    
    document.querySelectorAll(".design-button").forEach(button => {
      button.addEventListener("click", function() {
        handleDesignButtonClick(this.id);
      });
    });
    
    document.getElementById("onePlayer").addEventListener("click", onePlayerButtonClick);
    
    const twoPlayersBtn = document.getElementById("twoPlayers");
    if (twoPlayersBtn) {
      twoPlayersBtn.addEventListener("click", twoPlayersButtonClick);
    }
  }

  let isTwoPlayerMode = gameSettings.mode === "multiplayer";

  // Fonction pour le bouton One Player
  function onePlayerButtonClick() {
    const player2Input = document.getElementById("player2");
    const control2Container = document.getElementById("control2Container");
    const statusText = document.querySelector('.player2-container .status-text');
    const infoText = document.querySelector('.player2-container .text-muted');

    player2Input.value = "Bot-AI";
    gameSettings.player2 = "Bot-AI";
    gameSettings.isAIActive = true;
    player2Input.disabled = true;
    player2Input.placeholder = i18next.t('game.aiControlled');
    if (control2Container) control2Container.style.display = "none";
    if (statusText) statusText.style.display = 'none';
    if (infoText) infoText.style.display = 'none';

    const control1 = document.getElementById("control1");
    const control2 = document.getElementById("control2");
    if (control1) control1.value = isMobile ? "touch" : "arrows";
    if (control2) control2.value = "wasd";
    if (control1) control1.querySelectorAll("option").forEach(opt => opt.disabled = false);
    if (control2) control2.querySelectorAll("option").forEach(opt => opt.disabled = false);

    isTwoPlayerMode = false;
    gameSettings.mode = "solo";
    logger.log("Mode défini à:", gameSettings.mode);
    toggleActiveButton(".mode-button", "onePlayer");
  }

  // Fonction pour le bouton Two Players
  function twoPlayersButtonClick() {
    const player2Input = document.getElementById("player2");
    const control2Container = document.getElementById("control2Container");
    const statusText = document.querySelector('.player2-container .status-text');
    const infoText = document.querySelector('.player2-container .text-muted');

    player2Input.value = "";
    gameSettings.player2 = "";
    gameSettings.isAIActive = false;
    player2Input.disabled = false;
    player2Input.placeholder = i18next.t('game.enterPlayer2Name');
    if (control2Container) control2Container.style.display = "block";
    if (statusText) statusText.style.display = 'block';
    if (infoText) infoText.style.display = 'block';

    const control1 = document.getElementById("control1");
    const control2 = document.getElementById("control2");
    if (control1) control1.value = "arrows";
    if (control2) control2.value = "wasd";
    if (control1) {
      control1.querySelectorAll("option").forEach(opt => opt.disabled = false);
      const wasdOption = control1.querySelector("option[value='wasd']");
      if (wasdOption) wasdOption.disabled = true;
    }
    if (control2) {
      control2.querySelectorAll("option").forEach(opt => opt.disabled = false);
      const arrowsOption = control2.querySelector("option[value='arrows']");
      if (arrowsOption) arrowsOption.disabled = true;
    }

    isTwoPlayerMode = true;
    gameSettings.mode = "multiplayer";
    logger.log("Mode défini à:", gameSettings.mode);
    toggleActiveButton(".mode-button", "twoPlayers");
  }

  document.getElementById("numberOfGames").addEventListener("input", function() {
    gameSettings.numberOfGames = parseInt(this.value);
  });

  document.getElementById("numberOfGames").addEventListener("blur", function() {
    if (gameSettings.numberOfGames === "" || isNaN(gameSettings.numberOfGames)) {
      gameSettings.numberOfGames = 1;
      this.value = 1;
    } else if (gameSettings.numberOfGames < 1) {
      gameSettings.numberOfGames = 1;
      this.value = 1;
    } else if (gameSettings.numberOfGames > 5) {
      gameSettings.numberOfGames = 5;
      this.value = 5;
    }
  });

  document.getElementById("setsPerGame").addEventListener("input", function() {
    gameSettings.setsPerGame = parseInt(this.value);
  });

  document.getElementById("setsPerGame").addEventListener("blur", function() {
    if (this.value === "" || isNaN(gameSettings.setsPerGame)) {
      gameSettings.setsPerGame = 3;
      this.value = 3;
    } else if (gameSettings.setsPerGame < 1) {
      gameSettings.setsPerGame = 1;
      this.value = 1;
    } else if (gameSettings.setsPerGame > 5) {
      gameSettings.setsPerGame = 5;
      this.value = 5;
    }
  });

  document.getElementById("player2").addEventListener("input", function() {
    gameSettings.player2 = this.value;
  });

  if (!isMobile) {
    document.getElementById("control1").addEventListener("change", function() {
      const selected = this.value;
      gameSettings.control1 = this.value;
      const control2 = document.getElementById("control2");
      if (control2) {
        control2.querySelectorAll("option").forEach(opt => opt.disabled = false);
        const selectedOption = control2.querySelector(`option[value="${selected}"]`);
        if (selectedOption) selectedOption.disabled = true;
      }
    });
  } else {
    gameSettings.control1 = "touch";
  }

  document.getElementById("control2").addEventListener("change", function() {
    const selected = this.value;
    gameSettings.control2 = this.value;
    const control1 = document.getElementById("control1");
    if (control1) {
      control1.querySelectorAll("option").forEach(opt => opt.disabled = false);
      const selectedOption = control1.querySelector(`option[value="${selected}"]`);
      if (selectedOption) selectedOption.disabled = true;
    }
  });

  document.getElementById("toggleSoundButton").addEventListener("click", function() {
    gameSettings.soundEnabled = !gameSettings.soundEnabled;
    updateSoundButtonIcon();
  });

  function updateSoundButtonIcon() {
    const soundButton = document.getElementById("toggleSoundButton");
    if (gameSettings.soundEnabled) {
      soundButton.innerHTML = `<i class="bi bi-volume-up-fill" style="font-size: 1.5rem;"></i>`;
    } else {
      soundButton.innerHTML = `<i class="bi bi-volume-mute-fill" style="font-size: 1.5rem;"></i>`;
    }
  }

  let alertShown = false;
  let lastCheckedPlayer2 = "";
  let needAuth = false;

  document.getElementById("startGameButton").addEventListener("click", async () => {
    const player1 = username;
    let player2Raw = document.getElementById("player2").value.trim();
    let player2 = sanitizeAdvanced(player2Raw);

    document.getElementById("numberOfGames").dispatchEvent(new Event('blur'));
    document.getElementById("setsPerGame").dispatchEvent(new Event('blur'));

    logger.log("Start button clicked, gameSettings:", gameSettings);

    // Vérification si player2 est vide en mode multiplayer
    if (gameSettings.mode === "multiplayer" && !player2) {
      logger.log("Mode multiplayer, mais player2 est vide");
      showModal(
        i18next.t('game.error'),
        i18next.t('game.player2NameRequired') || "Please enter a name for Player 2 in multiplayer mode.",
        'OK',
        () => {
          document.getElementById("player2").focus(); // Remet le focus sur le champ player2
        }
      );
      return;
    }

    if (!alertShown || player2 !== lastCheckedPlayer2) {
      alertShown = false;
      needAuth = false;
      if (gameSettings.mode === "multiplayer") {
        logger.log("Mode multiplayer détecté, vérification de player2:", player2);
        try {
          const playerData = await checkPlayerExists(player2);

          if (playerData.exists && !playerData.is_guest) {
            logger.log("Joueur enregistré détecté, besoin d'authentification");
            showModal(
              i18next.t('game.registeredPlayer'),
              i18next.t('game.registeredPlayerMsg'),
              'OK',
              () => {
                alertShown = true;
                lastCheckedPlayer2 = player2;
                needAuth = true;
              },
              "player2"
            );
            return;
          } else if (playerData.exists) {
            logger.log("Joueur invité existant détecté");
            showModal(
              i18next.t('game.guestPlayer'),
              i18next.t('game.guestPlayerMsg'),
              'OK',
              () => {
                alertShown = true;
                lastCheckedPlayer2 = player2;
              },
              "player2"
            );
            return;
          } else {
            logger.log("Nouveau joueur, démarrage direct");
            startGameSetup(gameSettings);
            return;
          }
        } catch (error) {
          logger.error("Erreur lors de la vérification du joueur:", error);
          showModal(
            i18next.t('game.userNotFound'),
            i18next.t('game.errorCheckingPlayerMsg'),
            'OK',
            () => {},
            "player2"
          );
          return;
        }
      } else {
        logger.log("Mode solo, démarrage direct");
        startGameSetup(gameSettings);
        return;
      }
    }

    if (needAuth) {
      logger.log("Authentification requise pour player2:", player2);
      const authResult = await authenticateNow(player2, player1, gameSettings.numberOfGames, gameSettings.setsPerGame);
      if (authResult) {
        logger.log("Authentification réussie, démarrage du jeu");
        startGameSetup(gameSettings);
      } else {
        logger.log("Authentification échouée");
      }
    } else if (player2 !== lastCheckedPlayer2) {
      logger.log("Nouveau player2, démarrage du jeu");
      startGameSetup(gameSettings);
    } else {
      logger.log("Cas par défaut, démarrage du jeu");
      startGameSetup(gameSettings);
    }

    logger.log("Starting game with settings:", gameSettings);
  });

  function cleanupPlayersMap(container, playersMap) {
    const existingPlayerDivs = Array.from(container.querySelectorAll('.additional-player'));
    const existingPlayerNames = existingPlayerDivs.map(div => div.querySelector('input').value.trim().toLowerCase());

    playersMap.forEach((value, key) => {
      if (key !== '' && !existingPlayerNames.includes(key)) {
        playersMap.delete(key);
      }
    });
  }
}


async function authenticateNow(playerName, player1, numberOfGames, setsPerGame) {
  return new Promise((resolve, reject) => {
    const modalHTML = `
      <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="loginModalLabel">${i18next.t('game.loginToAuthenticate')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="loginForm">
                <div class="form-group">
                  <label for="username">${i18next.t('login.username')}</label>
                  <input type="text" class="form-control" id="username" placeholder="${i18next.t('login.enterUsername')}" required>
                </div>
                <div class="form-group">
                  <label for="password">${i18next.t('login.password')}</label>
                  <input type="password" class="form-control" id="password" placeholder="${i18next.t('login.enterPassword')}" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18next.t('app.close')}</button>
              <button type="button" class="btn btn-primary" id="submitLogin">${i18next.t('login.signIn')}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const loginModal = document.getElementById('loginModal');
    const modalBootstrap = new bootstrap.Modal(loginModal);
    modalBootstrap.show();

    document.getElementById('submitLogin').addEventListener('click', async function () {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const authResult = await authenticatePlayer(username, password, playerName);

      if (authResult.success) {
        modalBootstrap.hide();
        loginModal.remove();
        resolve(true); // Succès
      } else {
        // Gestion des différents types d'erreurs
        let errorMessage;
        if (authResult.error === 'badCredentials') {
          errorMessage = i18next.t('auth.badCredentials');
        } else if (authResult.error === 'network') {
          errorMessage = `Erreur réseau : ${authResult.details}`;
        } else {
          errorMessage = `${i18next.t('game.authenticationFailed')} ${authResult.details || ''}`;
        }

        showModal(
          i18next.t('app.error'),
          errorMessage,
          'OK',
          () => {}
        );
        modalBootstrap.hide();
        loginModal.remove();
        resolve(false); // Échec
      }
    });
  });
}

async function authenticatePlayer(username, password, playerName) {
  try {
    const response = await fetch('/api/auth/match-player/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        player_name: playerName
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Succès (statut 200 ou autre code de succès)
      return { success: true, data: data };
    } else if (response.status === 401) {
      // Échec d'authentification spécifique (mauvais identifiants)
      return { success: false, error: 'badCredentials' };
    } else {
      // Autre erreur (ex. 500, 403, etc.)
      return { success: false, error: 'generic', details: data.detail || 'Unknown error' };
    }
  } catch (error) {
    // Erreur réseau ou autre problème
    return { success: false, error: 'network', details: error.message };
  }
}



