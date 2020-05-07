<script>
const api_key = 'Dptezbzr0oEaddeqlkNaWwZh5fzFM9C4'
let q = ''
const limit = 1

let gif 

const hentBilde = () => {
fetch( `https://api.giphy.com/v1/gifs/search?q=${q}&limit=${limit}&api_key=${api_key}
`)
	.then ( res => res.json() )
	.then ( 
		json => { console.log(json)
		gif = json.data[0].images.downsized_medium.url 
		})
}		



</script>

<main>

<header>
<input placeholder="Search for gif" bind:value={q} on:keydown={(key) => key.key == "Enter"? hentBilde():''}>
<button on:click={hentBilde}>OK</button>
</header>

<div class="bilde">
{#if gif}
    <img src="{gif}" alt="{q}">
{:else}
    <h2>Search for gif</h2>
{/if} 
</div>
 

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

header {
	position: absolute;
	display: grid;
	place-items: center;
	width:100%;
	background-color:rgb(37, 231, 134);
	padding:2.5vh;
}

.bilde {
	

}

.input {
	outline:none;
}

</style>