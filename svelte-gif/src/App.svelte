

<script>

import { fade, fly, scale } from 'svelte/transition'
import { HeartIcon } from 'svelte-eva-icons'

const api_key = 'Dptezbzr0oEaddeqlkNaWwZh5fzFM9C4'
let q = ''
const limit = 1

let favorites = []  

let gif

let showFav = false

const hentBilde = () => {
	gif = null
fetch( `https://api.giphy.com/v1/gifs/search?q=${q}&limit=${limit}&api_key=${api_key}
`)
	.then ( res => res.json() )
	.then ( 
		json => { console.log(json)
		gif = json.data[0].images.downsized_medium.url 
		})
}

const addToFav = (gif) => {
	if(!favorites.includes(gif)){
	favorites = [gif, ...favorites]
	}else{
		favorites = favorites.filter( element => element != gif) 
	}
}



</script>

<main>

<header>
<input placeholder="Search for gif"
bind:value={q}
on:keydown={(key) => key.key == "Enter"? hentBilde():''}

on:click={ e => e.target.value=''}
on:focus={ e => e.target.value = '' }
on:click= { () => showFav = false}>

<button on:click={hentBilde}>OK</button>

{#if favorites.length > 0}
    <button in:scale on:click={ () => showFav = !showFav }>
	{ showFav ? 'skjul favoritter' : 'vis favoritter' }
	</button>
{/if}

</header>

{#if !showFav}
   {#if gif}
       <img
	   in:fly={{ y:600, duration:500}}
	   src="{gif}"
	   alt="{q}"
	   >

	<div class="heart"
	   on:click={()=>addToFav(gif)}
	   style={favorites.includes(gif) ? 'fill:red' : 'fill:gray'}
	   >
	   <HeartIcon/>
	</div>
   {:else}
   <h2>Search for gif</h2>
 {/if}
{:else}

   <div in:fly={{x:1000}} class="favorites">

{#each favorites as gif}

   <img src='{gif}' alt='giffy'>

{/each}

</div>
{/if}

</main>

<style>

:global(body, html){
		margin:0;
		padding:0;
	}

:global(*){
		box-sizing:border-box;
	}
main {
	display:grid;
	place-items: center;
	height:100%;
	background-color: blueviolet;
	
	
}

.heart {
	position: absolute;
	height:2rem;
	width:2rem;
	bottom:0.4rem;
	right:0.4rem;
	fill:gray;
}

header {
	position: absolute;
	display: grid;
	place-items: center;
	width:100%;
	background-color:rgb(37, 231, 134);
	padding:2.5vh;
}

img {

    max-height:60vh;
    width:60vw;
    object-fit: cover;

}


.input {
	outline:none;
}

.favorites{
	max-height:60vh;
	overflow:scroll;
	display: grid;
	gap:.2rem;
	grid-template-rows: repeat(4, 200px);
}

.favorites img {
	width:100%;
	height:200px;
	object-fit: cover;
}
</style>