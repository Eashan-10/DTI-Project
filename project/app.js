const TARGET_QUESTIONS = 50; 
const MIN_TO_SUBMIT = 10; 

let allData = {};
let questions = [];
let currentIndex = 0;
let userAnswers = {}; 

// 1. Fetch Data
fetch("question.json")
    .then(res => res.json())
    .then(data => {
        allData = data;
        displayLeaderboard(); 
    })
    .catch(err => console.error("Error loading JSON:", err));

// 2. Event Listeners
document.getElementById("start-btn").addEventListener("click", startQuiz);
document.getElementById("restart-btn").addEventListener("click", restartApp); 

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showquestion();
    } else {
        let totalSolved = Object.keys(userAnswers).length;
        if (totalSolved < TARGET_QUESTIONS) {
            alert(`You finished this set. You have ${totalSolved}/${TARGET_QUESTIONS} solved. Click 'Change Quiz' for more, or 'Submit Quiz' to finish early!`);
        } else {
            alert("You have reached 50 questions! Click 'Submit Quiz' to finish.");
        }
    }
});

document.getElementById("skip-btn").addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showquestion();
    }
});

document.getElementById("submit-btn").addEventListener("click", () => {
    let totalSolved = Object.keys(userAnswers).length;
    
    if (totalSolved < MIN_TO_SUBMIT) {
        alert(`You must solve at least ${MIN_TO_SUBMIT} questions to submit! You have only solved ${totalSolved}.`);
        return;
    }
    
    if (totalSolved < TARGET_QUESTIONS) {
        let confirmEarly = confirm(`You have only solved ${totalSolved} out of ${TARGET_QUESTIONS} questions. Submitting now will score the rest as 0. Are you sure?`);
        if (!confirmEarly) {
            return; 
        }
    }
    
    showResult();
});

// 3. Quiz Functions
function startQuiz() {
    let category = document.getElementById("category").value;
    let difficulty = document.getElementById("difficulty").value;
    let username = document.getElementById("username").value;

    if (!category || !difficulty || !username.trim()) {
        alert("Please enter your name and select Category & Difficulty!");
        return;
    }

    if (difficulty === "all") {
        questions = [
            ...allData[category]["easy"],
            ...allData[category]["medium"],
            ...allData[category]["hard"]
        ];
    } else {
        questions = allData[category][difficulty];
    }

    currentIndex = 0;

    document.getElementById("setup-section").style.display = "none";
    document.getElementById("quiz-section").style.display = "block";
    document.getElementById("result-section").style.display = "none";
    document.getElementById("submit-btn").style.display = "block";
    
    // Show Sidebar during quiz
    document.getElementById("sidebar").style.display = "block"; 
    
    document.getElementById("username").readOnly = true;

    updateSubmitButton();
    updateSidebar();
    showquestion();
}

function showquestion() {
    let q = questions[currentIndex];
    document.getElementById("question-text").innerText = `${currentIndex + 1}. ${q.question}`;

    let container = document.getElementById("options-container");
    container.innerHTML = "";

    q.options.forEach(opt => {
        let btn = document.createElement("button");
        btn.innerText = opt;
        btn.className = "option-btn";

        if (userAnswers[q.question] && userAnswers[q.question].selected === opt) {
            btn.style.background = "#add8e6"; 
            btn.style.border = "2px solid #007bff";
        }

        btn.addEventListener("click", () => {
            userAnswers[q.question] = {
                selected: opt,
                correct: q.answer
            };
            showquestion(); 
            updateSubmitButton();
            updateSidebar();
        });

        container.appendChild(btn);
    });
}

function updateSubmitButton() {
    let btn = document.getElementById("submit-btn");
    let totalSolved = Object.keys(userAnswers).length;
    
    let remainingToMinimum = MIN_TO_SUBMIT - totalSolved;

    if (remainingToMinimum <= 0) {
        btn.innerText = `Submit Quiz (${totalSolved}/${TARGET_QUESTIONS})`;
        btn.disabled = false;
        btn.style.opacity = "1";
    } else {
        btn.innerText = `Solve ${remainingToMinimum} more to unlock Submit`;
        btn.disabled = true;
        btn.style.opacity = "0.5";
    }
}

function updateSidebar() {
    let totalSolved = Object.keys(userAnswers).length;
    let catSelect = document.getElementById("category").value;
    let diffSelect = document.getElementById("difficulty").value;

    document.getElementById("side-category").innerText = catSelect || "-";
    document.getElementById("side-difficulty").innerText = diffSelect || "-";
    document.getElementById("side-solved").innerText = `${totalSolved} / ${TARGET_QUESTIONS}`;
}

function showResult() {
    document.getElementById("quiz-section").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("result-section").style.display = "block";
    
    // Hide Sidebar on results screen
    document.getElementById("sidebar").style.display = "none";

    let score = 0;
    
    for (const questionText in userAnswers) {
        if (userAnswers[questionText].selected === userAnswers[questionText].correct) {
            score++;
        }
    }

    document.getElementById("final-score").innerText = `Your score: ${score} / ${TARGET_QUESTIONS}`;
    
    let percent = (score / TARGET_QUESTIONS) * 100;
    let msg = percent >= 80 ? "Excellent!" : percent >= 50 ? "Good Job!" : "Keep Practicing!";
    document.getElementById("performance-msg").innerText = msg;

    let currentUsername = document.getElementById("username").value;
    saveToLeaderboard(currentUsername, score);
}

// 4. Leaderboard Functions
function saveToLeaderboard(name, score) {
    let leaderboard = JSON.parse(localStorage.getItem("brainBuzzLeaderboard")) || [];

    leaderboard.push({ name: name, score: score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem("brainBuzzLeaderboard", JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem("brainBuzzLeaderboard")) || [];
    let listElement = document.getElementById("leaderboard-section");
    listElement.innerHTML = ""; 

    if (leaderboard.length === 0) {
        listElement.innerHTML = "<li>No scores yet. Be the first to play!</li>";
        return;
    }

    leaderboard.forEach((player, index) => {
        let li = document.createElement("li");
        li.style.padding = "5px 0";
        li.style.fontSize = "1.2rem";
        
        let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔹";
        li.innerText = `${medal} ${player.name}: ${player.score} / ${TARGET_QUESTIONS}`;
        listElement.appendChild(li);
    });
}

// 5. Navigation Functions
function goBack() {
    document.getElementById("setup-section").style.display = "block";
    document.getElementById("quiz-section").style.display = "none";
    document.getElementById("result-section").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    
    // Hide Sidebar on main menu
    document.getElementById("sidebar").style.display = "none";

    currentIndex = 0;
    questions = [];
    
    updateSidebar();
}

function restartApp() {
    document.getElementById("setup-section").style.display = "block";
    document.getElementById("quiz-section").style.display = "none";
    document.getElementById("result-section").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    
    // Hide Sidebar on full restart
    document.getElementById("sidebar").style.display = "none";

    document.getElementById("username").readOnly = false;
    userAnswers = {}; 
    currentIndex = 0;
    questions = [];
    
    updateSidebar();
}