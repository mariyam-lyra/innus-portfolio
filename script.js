// ========================================
// SUPABASE CONNECTION
// ========================================

const SUPABASE_URL =
    "https://ramgdqoakjcodneennvg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_X8lFbyPiWv3qwcJvoBLOlA_OcfkXDvs";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ========================================
// AUTHOR LOGIN
// ========================================

const loginForm =
    document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            const message =
                document.getElementById(
                    "login-message"
                );

            message.textContent =
                "Signing in...";


            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                message.textContent =
                    error.message;

                return;
            }


            if (data.session) {

                message.textContent =
                    "Login successful ♡";

                window.location.href =
                    "dashboard.html";

            }

        }
    );

}


// ========================================
// AUTHOR DASHBOARD
// ========================================

const bookForm =
    document.getElementById("book-form");

if (bookForm) {

    checkAuthorSession();

    loadBooks();

}


// ========================================
// CHECK LOGIN SESSION
// ========================================

async function checkAuthorSession() {

    const {
        data: { session },
        error
    } =
        await supabaseClient.auth.getSession();


    if (error || !session) {

        window.location.href =
            "admin.html";

        return;

    }


    console.log(
        "Author is logged in:",
        session.user.email
    );

}


// ========================================
// LOGOUT
// ========================================

const logoutButton =
    document.getElementById(
        "logout-button"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const { error } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                return;

            }


            window.location.href =
                "admin.html";

        }
    );

}


// ========================================
// ADD NEW BOOK
// ========================================

if (bookForm) {

    bookForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "book-message"
                );


            const title =
                document
                    .getElementById("title")
                    .value
                    .trim();


            const tagline =
                document
                    .getElementById("tagline")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();


            const genre =
                document
                    .getElementById("genre")
                    .value
                    .trim();


            const bookUrl =
                document
                    .getElementById("book_url")
                    .value
                    .trim();


            const status =
                document
                    .getElementById("status")
                    .value;


            const publishedDateElement =
                document.getElementById(
                    "published_date"
                );


            const publishedDate =
                publishedDateElement
                    ? publishedDateElement.value
                    : "";


            const coverFile =
                document
                    .getElementById("cover")
                    .files[0];


            message.textContent =
                "Checking login...";


            // ----------------------------------------
            // CHECK AUTHENTICATION
            // ----------------------------------------

            const {
                data: { session },
                error: sessionError
            } =
                await supabaseClient.auth.getSession();


            if (sessionError || !session) {

                message.textContent =
                    "Your login session has expired. Please log in again.";


                setTimeout(
                    function () {

                        window.location.href =
                            "admin.html";

                    },
                    1500
                );


                return;

            }


            // ----------------------------------------
            // CHECK COVER
            // ----------------------------------------

            if (!coverFile) {

                message.textContent =
                    "Please choose a book cover.";

                return;

            }


            try {

                // ----------------------------------------
                // UPLOAD COVER
                // ----------------------------------------

                message.textContent =
                    "Uploading book cover...";


                const safeFileName =
                    coverFile.name
                        .replace(/\s+/g, "-")
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            ""
                        );


                const fileName =
                    `${Date.now()}-${safeFileName}`;


                const {
                    error: uploadError
                } =
                    await supabaseClient
                        .storage
                        .from("book-covers")
                        .upload(
                            fileName,
                            coverFile
                        );


                if (uploadError) {

                    throw uploadError;

                }


                // ----------------------------------------
                // GET PUBLIC URL
                // ----------------------------------------

                const {
                    data: publicUrlData
                } =
                    supabaseClient
                        .storage
                        .from("book-covers")
                        .getPublicUrl(
                            fileName
                        );


                const coverUrl =
                    publicUrlData.publicUrl;


                // ----------------------------------------
                // SAVE BOOK
                // ----------------------------------------

                message.textContent =
                    "Saving book...";


                const {
                    data: bookData,
                    error: insertError
                } =
                    await supabaseClient
                        .from("books")
                        .insert([

                            {
                                title:
                                    title,

                                tagline:
                                    tagline,

                                description:
                                    description,

                                genre:
                                    genre,

                                book_url:
                                    bookUrl,

                                status:
                                    status,

                                cover_url:
                                    coverUrl,

                                published_date:
                                    publishedDate ||
                                    null
                            }

                        ])
                        .select();


                if (insertError) {

                    throw insertError;

                }


                console.log(
                    "Book added:",
                    bookData
                );


                message.textContent =
                    "Book added successfully ♡";


                bookForm.reset();


                loadBooks();

            }

            catch (error) {

                console.error(
                    "Add book error:",
                    error
                );


                message.textContent =
                    "Something went wrong: " +
                    error.message;

            }

        }
    );

}


// ========================================
// LOAD BOOKS INTO DASHBOARD
// ========================================

async function loadBooks() {

    const booksList =
        document.getElementById(
            "books-list"
        );


    if (!booksList) {

        return;

    }


    booksList.textContent =
        "Loading books...";


    const {
        data: books,
        error
    } =
        await supabaseClient
            .from("books")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error loading books:",
            error
        );


        booksList.textContent =
            "Unable to load books.";

        return;

    }


    if (!books || books.length === 0) {

        booksList.textContent =
            "No books added yet.";

        return;

    }


    booksList.innerHTML = "";


    books.forEach(
        function (book) {

            const bookCard =
                document.createElement(
                    "div"
                );


            bookCard.className =
                "dashboard-book";


            let formattedDate = "";


            if (book.published_date) {

                const date =
                    new Date(
                        book.published_date
                    );


                formattedDate =
                    date.toLocaleDateString(
                        "en-US",
                        {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        }
                    );

            }


            bookCard.innerHTML = `

                <img
                    src="${escapeHTML(
                        book.cover_url || ""
                    )}"
                    alt="${escapeHTML(
                        book.title ||
                        "Book cover"
                    )}"
                >

                <div>

                    <h3>
                        ${escapeHTML(
                            book.title || ""
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            book.tagline || ""
                        )}
                    </p>

                    <span>
                        ${escapeHTML(
                            book.status || ""
                        )}
                    </span>

                    ${
                        formattedDate
                            ? `
                                <p>
                                    Published:
                                    ${escapeHTML(
                                        formattedDate
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        book.book_url
                            ? `
                                <br>

                                <a
                                    href="${escapeHTML(
                                        book.book_url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Google Play Books ♡
                                </a>
                            `
                            : ""
                    }

                    <div class="book-actions">

                        <button
                            class="button edit-book"
                            data-id="${book.id}"
                        >
                            Edit
                        </button>

                        <button
                            class="button secondary delete-book"
                            data-id="${book.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;


            booksList.appendChild(
                bookCard
            );

        }
    );


    // ========================================
    // EDIT BUTTONS
    // ========================================

    document
        .querySelectorAll(".edit-book")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        editBook(
                            this.dataset.id
                        );

                    }
                );

            }
        );


    // ========================================
    // DELETE BUTTONS
    // ========================================

    document
        .querySelectorAll(".delete-book")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        deleteBook(
                            this.dataset.id
                        );

                    }
                );

            }
        );

}


// ========================================
// DELETE BOOK
// ========================================

async function deleteBook(bookId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this book? ♡"
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            data: book,
            error: fetchError
        } =
            await supabaseClient
                .from("books")
                .select("cover_url")
                .eq("id", bookId)
                .single();


        if (fetchError) {

            throw fetchError;

        }


        // ----------------------------------------
        // DELETE DATABASE RECORD
        // ----------------------------------------

        const {
            error: deleteError
        } =
            await supabaseClient
                .from("books")
                .delete()
                .eq("id", bookId);


        if (deleteError) {

            throw deleteError;

        }


        // ----------------------------------------
        // DELETE COVER
        // ----------------------------------------

        if (
            book &&
            book.cover_url
        ) {

            const fileName =
                book.cover_url.split(
                    "/book-covers/"
                )[1];


            if (fileName) {

                await supabaseClient
                    .storage
                    .from("book-covers")
                    .remove([
                        decodeURIComponent(
                            fileName
                        )
                    ]);

            }

        }


        alert(
            "Book deleted successfully ♡"
        );


        loadBooks();


        loadAllBooks();

    }

    catch (error) {

        console.error(
            "Delete book error:",
            error
        );


        alert(
            "Unable to delete book: " +
            error.message
        );

    }

}


// ========================================
// EDIT BOOK
// ========================================

async function editBook(bookId) {

    try {

        const {
            data: book,
            error
        } =
            await supabaseClient
                .from("books")
                .select("*")
                .eq("id", bookId)
                .single();


        if (error) {

            throw error;

        }


        const newTitle =
            prompt(
                "Book title:",
                book.title || ""
            );


        if (newTitle === null) {

            return;

        }


        const newTagline =
            prompt(
                "Tagline:",
                book.tagline || ""
            );


        if (newTagline === null) {

            return;

        }


        const newDescription =
            prompt(
                "Description:",
                book.description || ""
            );


        if (newDescription === null) {

            return;

        }


        const newGenre =
            prompt(
                "Genre:",
                book.genre || ""
            );


        if (newGenre === null) {

            return;

        }


        const newStatus =
            prompt(
                "Status:",
                book.status || ""
            );


        if (newStatus === null) {

            return;

        }


        const newBookUrl =
            prompt(
                "Google Play Books link:",
                book.book_url || ""
            );


        if (newBookUrl === null) {

            return;

        }


        const {
            error: updateError
        } =
            await supabaseClient
                .from("books")
                .update({

                    title:
                        newTitle.trim(),

                    tagline:
                        newTagline.trim(),

                    description:
                        newDescription.trim(),

                    genre:
                        newGenre.trim(),

                    status:
                        newStatus.trim(),

                    book_url:
                        newBookUrl.trim()

                })
                .eq(
                    "id",
                    bookId
                );


        if (updateError) {

            throw updateError;

        }


        alert(
            "Book updated successfully ♡"
        );


        loadBooks();


        loadAllBooks();

    }

    catch (error) {

        console.error(
            "Edit book error:",
            error
        );


        alert(
            "Unable to update book: " +
            error.message
        );

    }

}


// ========================================
// LOAD ALL BOOKS ON PORTFOLIO
// ========================================

async function loadAllBooks() {

    const booksContainer =
        document.getElementById(
            "all-books"
        );


    // ----------------------------------------
    // IMPORTANT:
    // If this is dashboard/admin page,
    // there is no all-books container.
    // ----------------------------------------

    if (!booksContainer) {

        return;

    }


    booksContainer.innerHTML = `
        <p class="books-loading">
            Loading books...
        </p>
    `;


    try {

        const {
            data: books,
            error
        } =
            await supabaseClient
                .from("books")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Error loading books:",
                error
            );


            booksContainer.innerHTML = `
                <p class="books-loading">
                    Unable to load books.
                </p>
            `;

            return;

        }


        if (
            !books ||
            books.length === 0
        ) {

            booksContainer.innerHTML = `
                <p class="books-loading">
                    No books available yet.
                </p>
            `;

            return;

        }


        booksContainer.innerHTML = "";


        // ========================================
        // CREATE EACH BOOK
        // ========================================

        books.forEach(
            function (book) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "portfolio-book-card";


                // ----------------------------------------
                // DESCRIPTION
                // ----------------------------------------

                const description =
                    book.description || "";


                // ----------------------------------------
                // PUBLISHED DATE
                // ----------------------------------------

                let publishedDate = "";


                if (book.published_date) {

                    publishedDate =
                        new Date(
                            book.published_date
                        ).toLocaleDateString(
                            "en-US",
                            {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                            }
                        );

                }


                // ----------------------------------------
                // CARD
                // ----------------------------------------

                card.innerHTML = `

                    <div class="portfolio-book-cover">

                        <img
                            src="${escapeHTML(
                                book.cover_url || ""
                            )}"
                            alt="${escapeHTML(
                                book.title ||
                                "Book cover"
                            )}"
                        >

                    </div>


                    <div class="portfolio-book-info">

                        <p class="section-label">
                            ${
                                book.genre
                                    ? escapeHTML(
                                        book.genre
                                    )
                                    : "BOOK"
                            }
                        </p>


                        <h3>
                            ${escapeHTML(
                                book.title ||
                                ""
                            )}
                        </h3>


                        ${
                            book.tagline
                                ? `
                                    <p class="book-tagline">
                                        ${escapeHTML(
                                            book.tagline
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            description
                                ? `
                                    <p class="book-description">
                                        ${escapeHTML(
                                            description
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        <div class="book-details">

                            <div>

                                <span>
                                    GENRE
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        book.genre ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    STATUS
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        book.status ||
                                        "—"
                                    )}
                                </strong>

                            </div>

                        </div>


                        ${
                            publishedDate
                                ? `
                                    <p class="published-date">
                                        Published:
                                        ${escapeHTML(
                                            publishedDate
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            book.book_url
                                ? `
                                    <a
                                        href="${escapeHTML(
                                            book.book_url
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="button"
                                    >
                                        Read on Google Play Books ♡
                                    </a>
                                `
                                : ""
                        }

                    </div>

                `;


                booksContainer.appendChild(
                    card
                );

            }
        );


        console.log(
            `${books.length} book(s) loaded on portfolio.`
        );


    }

    catch (error) {

        console.error(
            "Portfolio books error:",
            error
        );


        booksContainer.innerHTML = `
            <p class="books-loading">
                Something went wrong while loading books.
            </p>
        `;

    }

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


// ========================================
// START PORTFOLIO BOOKS
// ========================================

loadAllBooks();