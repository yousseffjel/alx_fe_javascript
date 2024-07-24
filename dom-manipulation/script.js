// Load existing quotes.
const quotes = JSON.parse(localStorage.getItem("quotes") || "[]");

function showRandomQuote(event) {
    // Random index between 0 and "quotes" length
    const randomIdx = Math.floor(Math.random() * quotes.length);

    const randomQuote = quotes[randomIdx];

    // Show the quote if the event started by clicking
    // the "Show New Quote" button, and there is a quote
    if (event.target.id === "newQuote"
        && randomQuote ) {
            createAddQuoteForm(randomQuote);
    }
}

function createAddQuoteForm(quote) {
    document.getElementById("quoteDisplay").innerHTML = `<p> ${quote.text} </p>`;

    // Store this quote as the latest viewed quote
    // in session stroage
    sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote))
}

function addQuote() {
    const newQuoteText =
      document.getElementById("newQuoteText").value.trim();
    const newQuoteCategory =
      document.getElementById("newQuoteCategory").value.trim();

    if (!newQuoteText.length) {
        alert("You forgot to you add a quote!")
        return
    }

    if(!newQuoteCategory.length) {
        alert("You forgot to you specify a category!")
        return
    }

    quotes.push({
        text: newQuoteText,
        category: newQuoteCategory
    })

    // Empty inputs value
    document.getElementById("newQuoteText").value = ""
    document.getElementById("newQuoteCategory").value = "";

    // Update "quotes" in localStorage
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Update the categories in the dropdown if a new category is introduced.
    const uniqueExistingCategories =
      new Set(quotes.map(quote => quote.category));

    // Remove the new category from the set because
    // it's been added in the quotes array in line 38.
    uniqueExistingCategories.delete(newQuoteCategory);

    if (!uniqueExistingCategories
        .has(newQuoteCategory)) {
            const option = document.createElement("option");
            option.setAttribute("value", newQuoteCategory);
            option.textContent = newQuoteCategory;

            // Add option to the filter
            categoryFilter.appendChild(option)
    }

    const lastSelectedFilter = localStorage.getItem("lastSelectedFilter");
    // Show this new quote in the table if:
    // 1- the lastSelectedFilter is "all" or
    // 2- the lastSelectedFilter is the same as the newCategory
    if (
        lastSelectedFilter === "all" ||
        lastSelectedFilter === newQuoteCategory
    ) {
        const quotesTableBody = document.querySelector("#quotesTable > tbody");

        const tableRow = document.createElement("tr");
        const quoteTextElement = document.createElement("td");
        quoteTextElement.textContent = newQuoteText;

        const quoteCategoryElement = document.createElement("td");
        quoteCategoryElement.textContent = newQuoteCategory;

        tableRow.appendChild(quoteTextElement);
        tableRow.appendChild(quoteCategoryElement);

        // Add table row to the table body
        quotesTableBody.appendChild(tableRow);
    }
}

function  exportToJsonFile() {
    const quotes = JSON.parse(localStorage.getItem("quotes") || "[]");

    if (!quotes.length) {
        alert("No quotes found! try adding some quotes.");
        return
    }

    // Convert the array of objects to a JSON string
    const jsonString = JSON.stringify(quotes, null, 2);

    const blob = new Blob([jsonString], {type: "application/json"})
    const url = URL.createObjectURL(blob, {type: "application/json"})

    let link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', "quotes.json");
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
}

function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      localStorage.setItem("quotes", JSON.stringify(quotes))
      alert('Quotes imported successfully!');

      // Populate the dropdown with options
      // after the user imports quotes.
      populateCategories(quotes);

      // Show all quotes because,
      // the "select quote" default value is "all".
      filterQuotes()
    };
    fileReader.readAsText(event.target.files[0]);
}

function populateCategories(quotes) {
    const uniqueCategories = new Set(
        quotes.map(quote => quote.category)
    )

    const categoryFilter = document.getElementById("categoryFilter");

    uniqueCategories.forEach(category => {
        const option = document.createElement("option");
        option.setAttribute("value", category);
        option.textContent = category;

        // Add option to the filter
        categoryFilter.appendChild(option)
    })
}

function filterQuotes() {
    const categoryFilter = document.getElementById("categoryFilter");
    const selectedCategory = categoryFilter.value;

    const quotesTableBody = document.querySelector("#quotesTable > tbody");
    // Empty body of the table.
    quotesTableBody.innerHTML = "";

    quotes.forEach(quote => {
        // Do nothing if
        // 1- the current category is not the same
        // as the selected category.
        // AND
        // 2- the selected category is not of value "all".
        if (quote.category !== selectedCategory
            && selectedCategory !== "all") {
            return
        }

        const tableRow = document.createElement("tr");
        const quoteTextElement = document.createElement("td");
        quoteTextElement.textContent = quote.text;

        const quoteCategoryElement = document.createElement("td");
        quoteCategoryElement.textContent = quote.category;

        tableRow.appendChild(quoteTextElement);
        tableRow.appendChild(quoteCategoryElement);

        // Add table row to the table body
        quotesTableBody.appendChild(tableRow);
    })

    // Save latest selected filter
    localStorage.setItem("lastSelectedFilter", selectedCategory)
}

function restoreAndSaveLastSelectedFilter() {
    const lastSelectedFilter = localStorage.getItem("lastSelectedFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    if (lastSelectedFilter) {
        categoryFilter.value = lastSelectedFilter
    } else {
        categoryFilter.value = "all";
        localStorage.setItem("lastSelectedFilter", "all")
    }
}

async function fetchQuotesFromServer() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts");
        const posts = await response.json();
        return posts
    } catch(error) {
        console.error("Error fetching data:", error)
    }
}

async function postData() {
    const url = "https://jsonplaceholder.typicode.com/posts";
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "Work",
            body: "The only way to do great work is to love what you do.",
            category: "Motivational"
        })
    }

    try {
        const response = await fetch(url, options)
        const data = await response.json();
        console.log("data after posting =====>", data)
    } catch(error) {
        console.error("Error posting data:", error)
    }
}

function syncQuotes() {
    setInterval(async () => {
        const posts = await fetchQuotesFromServer();

        const randomIdx = Math.floor(Math.random() * 10 );
        // Format quotes.
        const randomQuotes = posts
          .slice(randomIdx, randomIdx*2)
          .map(post => {
            return {
                text: post.body,
                category: post.title.slice(0, 7),
            }
        })

        // Update quotes in localStorage.
        localStorage.setItem("quotes", JSON.stringify(randomQuotes));

        // Notify the user.
        document.getElementById("notificationMsg")
          .textContent = "Quotes synced with server!";

        // Wait for 1 second;
        await new Promise((res) => setTimeout(res, 1000));

        // Remvoe the notification msg.
        document.getElementById("notificationMsg")
          .textContent = "";


        // Empty dropdown categories and quotes in the table.
        document.getElementById("categoryFilter")
          .innerHTML = `<option value="all">All Categories</option>`;
        document.querySelector("#quotesTable > tbody")
          .innerHTML = null

        // Add category options
        populateCategories(randomQuotes);

        // Restore and aave last selected filter before filtering quotes
        restoreAndSaveLastSelectedFilter()

        // Update the quotes with the latest fetched data from the server.
        quotes.splice(0, quotes.length)
        quotes.push(...randomQuotes);

        // Filter Quotes and show them.
        filterQuotes()

        //////////////////////////////////////////////////////////////////////
    }, 4000)
}

window.addEventListener("DOMContentLoaded", () => {
    const newQuoteBtn = document.getElementById("newQuote");
    const exportToJSONBtn = document.getElementById("exportToJSON");

    newQuoteBtn.addEventListener("click", showRandomQuote);
    exportToJSONBtn.addEventListener("click", exportToJsonFile);

    // Add category options
    populateCategories(quotes);

    // Restore and aave last selected filter before filtering quotes
    restoreAndSaveLastSelectedFilter()

    // At first show all quotes because,
    // the "select quote" default value is "all".
    filterQuotes()

    // Post data to the server.
    postData()

    // Periodically fetch data and update the local storage accordingly.
    syncQuotes();
})
