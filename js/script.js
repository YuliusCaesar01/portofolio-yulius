// ===== KONFIGURASI GITHUB =====
const GITHUB_USERNAME = "YuliusCaesar01"; // GANTI dengan username GitHub Anda
const GITHUB_TOKEN = "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";

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }

    const navCollapse = document.getElementById("nav");
    if (navCollapse.classList.contains("show")) {
      navCollapse.classList.remove("show");
    }
  });
});

// ===== NAVBAR ON SCROLL =====
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.background = "rgba(15, 23, 42, 1)";
    navbar.style.boxShadow = "0 8px 16px -4px rgba(0, 0, 0, 0.2)";
  } else {
    navbar.style.background = "rgba(15, 23, 42, 0.95)";
    navbar.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
  }
});

// ===== GITHUB API FUNCTIONS =====
async function fetchGitHubData(endpoint) {
  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return null;
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (let [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

// ===== FETCH USER STATS =====
async function loadGitHubStats() {
  try {
    // Get user data
    const userData = await fetchGitHubData(`/users/${GITHUB_USERNAME}`);
    if (!userData) return;

    // Get repositories
    const repos = await fetchGitHubData(
      `/users/${GITHUB_USERNAME}/repos?per_page=100`
    );

    // Get events (for commits count)
    const events = await fetchGitHubData(
      `/users/${GITHUB_USERNAME}/events?per_page=100`
    );

    // Calculate stats
    const totalRepos = userData.public_repos || 0;
    const totalStars = repos
      ? repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
      : 0;

    // Count commits from events
    let totalCommits = 0;
    if (events) {
      totalCommits =
        events.filter((event) => event.type === "PushEvent").length * 3; // Estimate
    }

    // Count PRs from events
    let totalPRs = 0;
    if (events) {
      totalPRs = events.filter(
        (event) => event.type === "PullRequestEvent"
      ).length;
    }

    // Update DOM
    document.getElementById("total-repos").textContent = totalRepos;
    document.getElementById("total-commits").textContent = totalCommits + "+";
    document.getElementById("total-stars").textContent = totalStars;
    document.getElementById("total-prs").textContent = totalPRs;

    // Update about stats
    const statsItems = document.querySelectorAll(".stat-item h3");
    if (statsItems.length >= 2) {
      statsItems[0].textContent = totalRepos + "+";
      statsItems[1].textContent = totalCommits + "+";
    }
  } catch (error) {
    console.error("Error loading GitHub stats:", error);
  }
}

// ===== FETCH CONTRIBUTION DATA =====
async function loadGitHubContributions() {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`
    );

    if (!response.ok) throw new Error("Failed to fetch contributions");

    const data = await response.json();
    const calendar = document.getElementById("contribution-calendar");
    if (!calendar) return;

    calendar.innerHTML = "";

    // Get contribution data
    const contributions = data.contributions;

    // Pastikan contributions tidak kosong
    if (!contributions || contributions.length === 0) {
      calendar.innerHTML =
        '<div style="padding: 20px; color: #6c757d;">No contribution data available. Make sure "Private contributions" is enabled in your GitHub settings.</div>';
      return;
    }

    // Tambahkan padding di awal jika tidak dimulai dari hari Minggu
    const firstDate = new Date(contributions[0].date);
    const firstDay = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Tambahkan cell kosong untuk padding
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "contribution-day level-0";
      emptyDay.style.visibility = "hidden";
      calendar.appendChild(emptyDay);
    }

    // Render contribution days
    contributions.forEach((contrib) => {
      const contributionDay = document.createElement("div");
      contributionDay.className = "contribution-day";
      contributionDay.classList.add(`level-${contrib.level}`);

      const date = new Date(contrib.date);
      const dateStr = date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      contributionDay.title = `${contrib.count} contribution${
        contrib.count !== 1 ? "s" : ""
      } on ${dateStr}`;

      calendar.appendChild(contributionDay);
    });

    // Update total contributions
    const totalContribs = contributions.reduce((sum, c) => sum + c.count, 0);
    console.log("✅ Total contributions:", totalContribs);

    // Tambahkan display total (opsional)
    const graphHeader = document.querySelector(".contribution-graph h4");
    if (graphHeader) {
      graphHeader.innerHTML = `Contribution Activity (Last Year) <span style="color: #6c757d; font-weight: 400; font-size: 14px;">— ${totalContribs} total</span>`;
    }
  } catch (error) {
    console.error("❌ Error loading contributions:", error);
    const calendar = document.getElementById("contribution-calendar");
    if (calendar) {
      calendar.innerHTML =
        '<div style="padding: 20px; color: #dc3545;">Failed to load contributions. Please check your internet connection.</div>';
    }
  }
}

// ===== FETCH RECENT ACTIVITY =====
async function loadGitHubActivity() {
  const activityList = document.querySelector(".activity-list");
  if (!activityList) return;

  try {
    activityList.innerHTML =
      '<div style="text-align: center; padding: 20px; color: #8b949e;">Loading...</div>';

    const events = await fetchGitHubData(
      `/users/${GITHUB_USERNAME}/events?per_page=10`
    );

    if (!events || events.length === 0) {
      activityList.innerHTML =
        '<div style="text-align: center; padding: 20px; color: #f85149;">No recent activity found</div>';
      return;
    }

    activityList.innerHTML = "";

    events.slice(0, 5).forEach((event) => {
      const activityItem = document.createElement("div");
      activityItem.className = "activity-item";

      let iconClass = "commit";
      let iconName = "fa-code-commit";
      let actionText = "";
      let details = "";

      switch (event.type) {
        case "PushEvent":
          iconClass = "commit";
          iconName = "fa-code-commit";
          const branch = event.payload.ref?.split("/").pop() || "main";
          const commits = event.payload.commits?.length || 0;
          actionText = "Pushed to";
          details = `${branch} (${commits} commit${commits > 1 ? "s" : ""})`;
          break;

        case "PullRequestEvent":
          iconClass = "pr";
          iconName = "fa-code-pull-request";
          actionText =
            event.payload.action === "opened"
              ? "Opened pull request"
              : event.payload.action === "closed"
              ? "Closed pull request"
              : "Updated pull request";
          details = `#${event.payload.pull_request?.number || ""}`;
          break;

        case "WatchEvent":
          iconClass = "star";
          iconName = "fa-star";
          actionText = "Starred";
          details = "";
          break;

        case "CreateEvent":
          iconClass = "repo";
          iconName = "fa-book";
          actionText = `Created ${event.payload.ref_type}`;
          details = event.payload.ref || "";
          break;

        case "ForkEvent":
          iconClass = "repo";
          iconName = "fa-code-branch";
          actionText = "Forked";
          details = "";
          break;

        case "IssuesEvent":
          iconClass = "pr";
          iconName = "fa-circle-dot";
          actionText =
            event.payload.action === "opened" ? "Opened issue" : "Closed issue";
          details = `#${event.payload.issue?.number || ""}`;
          break;

        default:
          iconClass = "commit";
          iconName = "fa-code";
          actionText = event.type.replace("Event", "");
          details = "";
      }

      const timeAgo = getTimeAgo(new Date(event.created_at));
      const repoName = event.repo.name;

      activityItem.innerHTML = `
        <div class="activity-icon ${iconClass}">
          <i class="fas ${iconName}"></i>
        </div>
        <div class="activity-content">
          <p>
            <strong>${actionText}</strong> ${details} in ${repoName}
          </p>
          <span class="activity-time">${timeAgo}</span>
        </div>
      `;

      activityList.appendChild(activityItem);
    });
  } catch (error) {
    console.error("Error loading activity:", error);
    activityList.innerHTML =
      '<div style="text-align: center; padding: 20px; color: #f85149;">Failed to load activity. Check your GitHub token.</div>';
  }
}

// ===== HELPER: TIME AGO =====
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return "just now";
}

// ===== FETCH REPOSITORIES FOR PROJECTS =====
async function loadGitHubProjects() {
  try {
    const repos = await fetchGitHubData(
      `/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
    );
    if (!repos) return;

    // Optional: Update project cards with real repo data
    // You can dynamically generate project cards here if needed
    console.log("Top repositories:", repos.slice(0, 4));
  } catch (error) {
    console.error("Error loading projects:", error);
  }
}

// ===== ANIMATE STATS =====
function animateStats() {
  const stats = document.querySelectorAll(".stat-box h3, .stat-item h3");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const text = target.textContent;
          const hasPlus = text.includes("+");
          const finalValue = parseInt(text.replace("+", ""));

          if (isNaN(finalValue)) return;

          let currentValue = 0;
          const increment = finalValue / 50;

          const updateCounter = () => {
            if (currentValue < finalValue) {
              currentValue += increment;
              target.textContent =
                Math.floor(currentValue) + (hasPlus ? "+" : "");
              requestAnimationFrame(updateCounter);
            } else {
              target.textContent = finalValue + (hasPlus ? "+" : "");
            }
          };

          updateCounter();
          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((stat) => observer.observe(stat));
}

// ===== FORM SUBMISSION =====
document
  .getElementById("contactForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    alert(
      "Terima kasih! Pesan Anda telah terkirim. (Demo - Form tidak benar-benar mengirim email)"
    );
    this.reset();
  });

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Loading GitHub data for:", GITHUB_USERNAME);

  // Load all GitHub data
  await loadGitHubStats();
  await loadGitHubContributions();
  await loadGitHubActivity();
  await loadGitHubProjects();

  // Animate stats after data is loaded
  setTimeout(animateStats, 500);

  console.log("Portfolio loaded successfully!");
});

// ===== ANIMATE ELEMENTS ON SCROLL =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

document
  .querySelectorAll(".skill-card, .project-card, .timeline-item")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    scrollObserver.observe(el);
  });
