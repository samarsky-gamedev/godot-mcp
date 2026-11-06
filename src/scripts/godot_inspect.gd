extends SceneTree

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() != 1:
		push_error("Expected one scene path")
		quit(1)
		return
	var packed := load(args[0]) as PackedScene
	if packed == null:
		push_error("Cannot load PackedScene")
		quit(1)
		return
	# SceneState reads saved data; no instantiate and no _ready execution.
	var state := packed.get_state()
	var nodes: Array[Dictionary] = []
	for i in state.get_node_count():
		nodes.append({"path": str(state.get_node_path(i)), "name": str(state.get_node_name(i)), "type": str(state.get_node_type(i))})
	print("GODOT_JSON:" + JSON.stringify({"scene": args[0], "nodes": nodes, "count": nodes.size(), "scope": "saved_scene"}))
	quit(0)
