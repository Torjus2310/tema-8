
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.19.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[18] = list;
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (66:2) {#each filteredTodos as todo}
    function create_each_block(ctx) {
    	let div3;
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let t1_value = /*todo*/ ctx[17].title + "";
    	let t1;
    	let t2;
    	let div2;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[12].call(input, /*todo*/ ctx[17]);
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[13](/*todo*/ ctx[17], ...args);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "×";
    			attr_dev(input, "class", "checkbox");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 68, 4, 1236);
    			attr_dev(div0, "class", "todo-item-label svelte-1wujn9c");
    			toggle_class(div0, "completed", /*todo*/ ctx[17].completed);
    			add_location(div0, file, 69, 5, 1312);
    			attr_dev(div1, "class", "todo-item-left svelte-1wujn9c");
    			add_location(div1, file, 67, 3, 1202);
    			attr_dev(div2, "class", "remove-item svelte-1wujn9c");
    			add_location(div2, file, 74, 3, 1427);
    			attr_dev(div3, "class", "todo-item svelte-1wujn9c");
    			add_location(div3, file, 66, 2, 1175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, input);
    			input.checked = /*todo*/ ctx[17].completed;
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			dispose = [
    				listen_dev(input, "change", input_change_handler),
    				listen_dev(div2, "click", click_handler, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*filteredTodos*/ 8) {
    				input.checked = /*todo*/ ctx[17].completed;
    			}

    			if (dirty & /*filteredTodos*/ 8 && t1_value !== (t1_value = /*todo*/ ctx[17].title + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*filteredTodos*/ 8) {
    				toggle_class(div0, "completed", /*todo*/ ctx[17].completed);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(66:2) {#each filteredTodos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let body;
    	let div6;
    	let h1;
    	let t1;
    	let input0;
    	let t2;
    	let t3;
    	let div2;
    	let div0;
    	let label;
    	let input1;
    	let t4;
    	let t5;
    	let div1;
    	let t6;
    	let t7;
    	let t8;
    	let div5;
    	let div3;
    	let button0;
    	let t10;
    	let button1;
    	let t12;
    	let button2;
    	let t14;
    	let div4;
    	let button3;
    	let dispose;
    	let each_value = /*filteredTodos*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			body = element("body");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "To do list";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			div0 = element("div");
    			label = element("label");
    			input1 = element("input");
    			t4 = text("Sjekk av alle");
    			t5 = space();
    			div1 = element("div");
    			t6 = text(/*todosRemaining*/ ctx[2]);
    			t7 = text(" items left");
    			t8 = space();
    			div5 = element("div");
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Alle";
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Aktiv";
    			t12 = space();
    			button2 = element("button");
    			button2.textContent = "Ferdig";
    			t14 = space();
    			div4 = element("div");
    			button3 = element("button");
    			button3.textContent = "Fjern Ferdige";
    			add_location(h1, file, 61, 0, 1004);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "todo-input svelte-1wujn9c");
    			attr_dev(input0, "placeholder", "hva skal gjøres");
    			add_location(input0, file, 62, 2, 1026);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file, 81, 20, 1590);
    			add_location(label, file, 81, 13, 1583);
    			add_location(div0, file, 81, 8, 1578);
    			add_location(div1, file, 82, 8, 1676);
    			attr_dev(div2, "class", "extra-container svelte-1wujn9c");
    			add_location(div2, file, 80, 6, 1540);
    			attr_dev(button0, "class", "svelte-1wujn9c");
    			toggle_class(button0, "active", /*currentFilter*/ ctx[0] === "all");
    			add_location(button0, file, 87, 10, 1789);
    			attr_dev(button1, "class", "svelte-1wujn9c");
    			toggle_class(button1, "active", /*currentFilter*/ ctx[0] === "active");
    			add_location(button1, file, 88, 10, 1899);
    			attr_dev(button2, "class", "svelte-1wujn9c");
    			toggle_class(button2, "active", /*currentFilter*/ ctx[0] === "completed");
    			add_location(button2, file, 89, 10, 2016);
    			add_location(div3, file, 86, 8, 1773);
    			attr_dev(button3, "class", "svelte-1wujn9c");
    			add_location(button3, file, 93, 10, 2170);
    			add_location(div4, file, 92, 8, 2154);
    			attr_dev(div5, "class", "extra-container svelte-1wujn9c");
    			add_location(div5, file, 85, 6, 1735);
    			attr_dev(div6, "class", "container svelte-1wujn9c");
    			add_location(div6, file, 59, 0, 979);
    			add_location(body, file, 54, 0, 968);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t1);
    			append_dev(div6, input0);
    			set_input_value(input0, /*newTodo*/ ctx[1]);
    			append_dev(div6, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(label, input1);
    			append_dev(label, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, t6);
    			append_dev(div1, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t10);
    			append_dev(div3, button1);
    			append_dev(div3, t12);
    			append_dev(div3, button2);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div4, button3);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    				listen_dev(input0, "keydown", /*addTodo*/ ctx[4], false, false, false),
    				listen_dev(input1, "change", /*checkAllTodos*/ ctx[7], false, false, false),
    				listen_dev(button0, "click", /*click_handler_1*/ ctx[14], false, false, false),
    				listen_dev(button1, "click", /*click_handler_2*/ ctx[15], false, false, false),
    				listen_dev(button2, "click", /*click_handler_3*/ ctx[16], false, false, false),
    				listen_dev(button3, "click", /*clearCompleted*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTodo*/ 2 && input0.value !== /*newTodo*/ ctx[1]) {
    				set_input_value(input0, /*newTodo*/ ctx[1]);
    			}

    			if (dirty & /*deleteTodo, filteredTodos*/ 40) {
    				each_value = /*filteredTodos*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div6, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*todosRemaining*/ 4) set_data_dev(t6, /*todosRemaining*/ ctx[2]);

    			if (dirty & /*currentFilter*/ 1) {
    				toggle_class(button0, "active", /*currentFilter*/ ctx[0] === "all");
    			}

    			if (dirty & /*currentFilter*/ 1) {
    				toggle_class(button1, "active", /*currentFilter*/ ctx[0] === "active");
    			}

    			if (dirty & /*currentFilter*/ 1) {
    				toggle_class(button2, "active", /*currentFilter*/ ctx[0] === "completed");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;

    function instance($$self, $$props, $$invalidate) {
    	let currentFilter = "all";
    	let newTodo = "";
    	let tempId = 4;
    	let todos = [];

    	function addTodo(event) {
    		if (event.which === ENTER_KEY) {
    			todos.push({
    				id: tempId,
    				completed: false,
    				title: newTodo,
    				editing: false
    			});

    			$$invalidate(10, todos);
    			tempId = tempId + 1;
    			$$invalidate(1, newTodo = "");
    		}
    	}

    	function deleteTodo(id) {
    		$$invalidate(10, todos = todos.filter(todo => todo.id !== id));
    	}

    	function clearCompleted() {
    		$$invalidate(10, todos = todos.filter(todo => !todo.completed));
    	}

    	function checkAllTodos(event) {
    		todos.forEach(todo => todo.completed = event.target.checked);
    		$$invalidate(10, todos);
    	}

    	function updateFilter(filter) {
    		$$invalidate(0, currentFilter = filter);
    	}

    	function input0_input_handler() {
    		newTodo = this.value;
    		$$invalidate(1, newTodo);
    	}

    	function input_change_handler(todo) {
    		todo.completed = this.checked;
    		(($$invalidate(3, filteredTodos), $$invalidate(0, currentFilter)), $$invalidate(10, todos));
    	}

    	const click_handler = todo => deleteTodo(todo.id);
    	const click_handler_1 = () => updateFilter("all");
    	const click_handler_2 = () => updateFilter("active");
    	const click_handler_3 = () => updateFilter("completed");

    	$$self.$capture_state = () => ({
    		ENTER_KEY,
    		ESCAPE_KEY,
    		currentFilter,
    		newTodo,
    		tempId,
    		todos,
    		addTodo,
    		deleteTodo,
    		clearCompleted,
    		checkAllTodos,
    		updateFilter,
    		todosRemaining,
    		filteredTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentFilter" in $$props) $$invalidate(0, currentFilter = $$props.currentFilter);
    		if ("newTodo" in $$props) $$invalidate(1, newTodo = $$props.newTodo);
    		if ("tempId" in $$props) tempId = $$props.tempId;
    		if ("todos" in $$props) $$invalidate(10, todos = $$props.todos);
    		if ("todosRemaining" in $$props) $$invalidate(2, todosRemaining = $$props.todosRemaining);
    		if ("filteredTodos" in $$props) $$invalidate(3, filteredTodos = $$props.filteredTodos);
    	};

    	let todosRemaining;
    	let filteredTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1024) {
    			 $$invalidate(2, todosRemaining = todos.filter(todo => !todo.completed).length);
    		}

    		if ($$self.$$.dirty & /*currentFilter, todos*/ 1025) {
    			 $$invalidate(3, filteredTodos = currentFilter === "all"
    			? todos
    			: currentFilter === "completed"
    				? todos.filter(todo => todo.completed)
    				: todos.filter(todo => !todo.completed));
    		}
    	};

    	return [
    		currentFilter,
    		newTodo,
    		todosRemaining,
    		filteredTodos,
    		addTodo,
    		deleteTodo,
    		clearCompleted,
    		checkAllTodos,
    		updateFilter,
    		tempId,
    		todos,
    		input0_input_handler,
    		input_change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: ''
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
