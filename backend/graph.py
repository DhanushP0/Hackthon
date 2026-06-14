
# this code is for the graph which will give us all the users !!!




# import pandas as pd
# import networkx as nx
# import matplotlib.pyplot as plt

# # =====================================
# # LOAD DATA
# # =====================================

# users = pd.read_csv("risk_scored_users.csv")

# print(f"Loaded {len(users)} users")

# # =====================================
# # GRAPH
# # =====================================

# G = nx.Graph()

# # =====================================
# # USER -> SYSTEM EDGES
# # =====================================

# for _, row in users.iterrows():

#     user = row["username"]

#     systems = str(
#         row.get(
#             "systems_access",
#             ""
#         )
#     )

#     systems = [
#         s.strip()
#         for s in systems.split("|")
#         if s.strip()
#     ]

#     G.add_node(
#         user,
#         node_type="user",
#         risk=row["risk_score"]
#     )

#     for system in systems:

#         G.add_node(
#             system,
#             node_type="system"
#         )

#         G.add_edge(
#             user,
#             system
#         )

# # =====================================
# # COLORS
# # =====================================

# colors = []

# for node in G.nodes():

#     data = G.nodes[node]

#     if data.get("node_type") == "system":
#         colors.append("lightblue")

#     else:

#         risk = data.get(
#             "risk",
#             0
#         )

#         if risk >= 90:
#             colors.append("red")

#         elif risk >= 70:
#             colors.append("orange")

#         elif risk >= 40:
#             colors.append("yellow")

#         else:
#             colors.append("lightgreen")

# # =====================================
# # LAYOUT
# # =====================================

# plt.figure(
#     figsize=(20, 15)
# )

# pos = nx.spring_layout(
#     G,
#     k=0.8,
#     seed=42
# )

# nx.draw_networkx_nodes(
#     G,
#     pos,
#     node_color=colors,
#     node_size=300
# )

# nx.draw_networkx_edges(
#     G,
#     pos,
#     alpha=0.3
# )

# # =====================================
# # LABEL HIGH RISK ONLY
# # =====================================

# labels = {}

# for node in G.nodes():

#     data = G.nodes[node]

#     if (
#         data.get("node_type")
#         == "user"
#         and data.get(
#             "risk",
#             0
#         ) >= 70
#     ):
#         labels[node] = node

# nx.draw_networkx_labels(
#     G,
#     pos,
#     labels,
#     font_size=8
# )

# plt.title(
#     "Identity Risk Graph"
# )

# plt.axis("off")

# # =====================================
# # SAVE
# # =====================================

# plt.savefig(
#     "identity_graph.png",
#     dpi=300,
#     bbox_inches="tight"
# )

# print(
#     "Saved -> identity_graph.png"
# )

# # =====================================
# # HIGH RISK CLUSTERS
# # =====================================

# print(
#     "\nHigh Risk Users\n"
# )

# for node in G.nodes():

#     data = G.nodes[node]

#     if (
#         data.get("node_type")
#         == "user"
#         and data.get(
#             "risk",
#             0
#         ) >= 70
#     ):
#         print(
#             f"{node} : "
#             f"{data['risk']}"
#         )


# this is the code which will give me the graph for the 


import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt

# =====================================
# LOAD DATA
# =====================================

users = pd.read_csv("risk_scored_users.csv")

print(f"Loaded {len(users)} users")

# =====================================
# KEEP ONLY HIGH RISK USERS
# =====================================

users = users[
    users["risk_score"] >= 70
].copy()

print(
    f"Visualizing {len(users)} high-risk users"
)

# =====================================
# BUILD GRAPH
# =====================================

G = nx.Graph()

for _, row in users.iterrows():

    user = row["username"]

    risk = float(
        row["risk_score"]
    )

    systems = str(
        row.get(
            "systems_access",
            ""
        )
    )

    systems = [
        s.strip()
        for s in systems.split("|")
        if s.strip()
    ]

    G.add_node(
        user,
        node_type="user",
        risk=risk
    )

    for system in systems:

        G.add_node(
            system,
            node_type="system"
        )

        G.add_edge(
            user,
            system
        )

# =====================================
# NODE COLORS
# =====================================

node_colors = []
node_sizes = []

for node in G.nodes():

    data = G.nodes[node]

    if data.get("node_type") == "system":

        node_colors.append(
            "skyblue"
        )

        node_sizes.append(
            1200
        )

    else:

        risk = data.get(
            "risk",
            0
        )

        if risk >= 90:

            node_colors.append(
                "red"
            )

        elif risk >= 70:

            node_colors.append(
                "orange"
            )

        else:

            node_colors.append(
                "lightgreen"
            )

        node_sizes.append(
            300 + (risk * 8)
        )

# =====================================
# LAYOUT
# =====================================

plt.figure(
    figsize=(18, 12)
)

pos = nx.kamada_kawai_layout(
    G
)

# =====================================
# DRAW EDGES
# =====================================

nx.draw_networkx_edges(
    G,
    pos,
    alpha=0.25,
    width=1
)

# =====================================
# DRAW NODES
# =====================================

nx.draw_networkx_nodes(
    G,
    pos,
    node_color=node_colors,
    node_size=node_sizes,
    alpha=0.9
)

# =====================================
# LABELS
# =====================================

labels = {}

for node in G.nodes():

    data = G.nodes[node]

    if (
        data.get("node_type")
        == "user"
    ):

        if data.get(
            "risk",
            0
        ) >= 70:

            labels[node] = node

    else:

        labels[node] = node

nx.draw_networkx_labels(
    G,
    pos,
    labels,
    font_size=8
)

# =====================================
# HIGH RISK CLUSTERS
# =====================================

clusters = list(
    nx.connected_components(G)
)

high_risk_clusters = []

for cluster in clusters:

    risky_users = []

    for node in cluster:

        data = G.nodes[node]

        if (
            data.get("node_type")
            == "user"
            and data.get(
                "risk",
                0
            ) >= 70
        ):
            risky_users.append(
                node
            )

    if len(risky_users) >= 2:

        high_risk_clusters.append(
            risky_users
        )

# =====================================
# TITLE
# =====================================

plt.title(
    "High-Risk Identity Access Graph",
    fontsize=16,
    fontweight="bold"
)

plt.axis("off")

# =====================================
# SAVE
# =====================================

plt.savefig(
    "identity_graph.png",
    dpi=300,
    bbox_inches="tight"
)

print(
    "\nSaved -> identity_graph.png"
)

# =====================================
# CLUSTER REPORT
# =====================================

print(
    "\n========== HIGH RISK CLUSTERS ==========\n"
)

if len(high_risk_clusters) == 0:

    print(
        "No isolated high-risk clusters found"
    )

else:

    for idx, cluster in enumerate(
        high_risk_clusters,
        start=1
    ):

        print(
            f"Cluster {idx}:"
        )

        for user in cluster:

            print(
                f"  - {user}"
            )

        print()