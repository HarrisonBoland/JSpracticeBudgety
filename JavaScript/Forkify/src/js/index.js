import Search from './modals/Search';
import Recipe from './modals/Recipe';
import List from './modals/List';
import Likes from './modals/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/* Global state of the app
    - Search Object
    - Current recipe Object
    - Shopping list Object
    - Liked recipes
*/
const state = {};


// SEARCH CONTROLLER
const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput();

    if (query) {
        // 2 New search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI from results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4. Search for recipers
            await state.search.getResults();

            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result)
        } catch (error) {
            console.log(error);
        };
    };
};

elements.searchForm.addEventListener('click', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    };
});


// RECIPE CONTROLLER
const controlRecipe = async () => {
    // Get ID from URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected recipe
        if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate serving and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch (error) {
            console.log(error);
        };
    };
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


// LIST CONTROLLER
const controlList = () => {
    // Create a new list if there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};


// Handle delete and update list item elements
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
})



// LIKE CONTROLLER
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;

    // User has not yet liked current recipe
    if (!state.likes.isLiked(currentId)) {
        // Add like to state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.publisher,
            state.recipe.img
        )
        // Toggle the like button
        likesView.toggleLikeBtn(true);
            
        // Add like to UI
        likesView.renderLike(newLike);

    // User has liked the current recipe
    } else {
        // Remove like to state
        state.likes.deleteLike(currentId);
 
        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like to UI
        likesView.deleteLike(currentId);
    };
    likesView.toggleLikedMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore Likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikedMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like Controller
        controlLike();
    };
});
