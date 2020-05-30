<script>
const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

let currentFilter = 'all';
let newTodo = '';
let tempId = 4;
let todos = [

];


function addTodo(event) {
  if(event.which === ENTER_KEY){
     todos.push({
       id: tempId,
       completed: false,
       title: newTodo,
       editing: false,
     })

     todos = todos;
     tempId = tempId + 1;
     newTodo = '';
  }
}

function deleteTodo(id){
  todos = todos.filter(todo => todo.id !== id);
}

function clearCompleted() {
  todos = todos.filter(todo => !todo.completed);
}

function checkAllTodos(event){
  todos.forEach(todo => todo.completed = event.target.checked);
  todos = todos;
}

function updateFilter(filter){
  currentFilter = filter;
}

$: todosRemaining = todos.filter(todo => !todo.completed).length;

$: filteredTodos = currentFilter === 'all'
  ? todos
  :currentFilter === 'completed'
    ? todos.filter(todo => todo.completed)
    : todos.filter(todo => !todo.completed);


</script>
<body>




<div class="container">

<h1>To do list</h1>
  <input type="text" class="todo-input" placeholder="hva skal gjøres"
   bind:value={newTodo} on:keydown={addTodo}>

  {#each filteredTodos as todo}
		<div class="todo-item">
			<div class="todo-item-left" >
				<input class="checkbox" type="checkbox" bind:checked={todo.completed}>
				 <div class="todo-item-label" class:completed={todo.completed}>{todo.title}
         </div>
         
			</div>

			<div class="remove-item" on:click={()=> deleteTodo(todo.id)}>
				&times;
			</div>
		</div>
    {/each}
	
      <div class="extra-container">
        <div><label><input type="checkbox" on:change={checkAllTodos} >Sjekk av alle</label></div>
        <div>{todosRemaining} items left</div>
      </div>

      <div class="extra-container">
        <div>
          <button on:click={() => updateFilter('all')} class:active="{currentFilter === 'all'}">Alle</button>
          <button on:click={() => updateFilter('active')} class:active="{currentFilter === 'active'}">Aktiv</button>
          <button on:click={() => updateFilter('completed')} class:active="{currentFilter === 'completed'}">Ferdig</button>
        </div>

        <div>
          <button on:click={clearCompleted}>Fjern Ferdige</button>
        </div>
      </div>
    </div>

</body>


<style lang="scss">
:global(body){
    background-color: #5C6673;
    box-sizing: border-box;
    margin:0;

}

  .container {
		max-width:400px;
    margin: 0 auto;
    background-color: #5C6673;
    padding:2rem;
    color:#63BF21;
    
	}
	
	.todo-input {
    width: 100%;
    padding: 10px 18px;
    font-size: 18px;
    margin-bottom: 16px;
    border-radius:1rem;
    border:none;
    outline:none;
  }
  .todo-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation-duration: 0.3s;
  }
  .remove-item {
    cursor: pointer;
    margin-left: 14px;
    
  }
  .todo-item-left {
   display: flex;
   align-items: center;
  }
  .todo-item-label {
    padding: 10px;
    margin-left: 12px;
  }
  .todo-item-edit {
    font-size: 24px;
    margin-left: 12px;
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
   
  }
  .completed {
    text-decoration: line-through;
    color: grey;
  }
  .extra-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    border-top: 1px solid #C7F29B;
    padding-top: 14px;
    margin-bottom: 14px;
   
  }
  button {
    font-size: 14px;
    background-color: #C7F29B;
    border-radius:1rem;
    border: solid #63BF21 1px ;
    color:#5C6673;
    outline:none;
    
  }
  button:hover {
    font-size: 14px;
    background-color:#63BF21;
    
  }

  
</style>

