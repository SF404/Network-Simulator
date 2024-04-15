#include <iostream>
using namespace std;

class Node
{
public:
    int data;
    Node *next[5]; // Array of 5 next pointers
    Node *hub;
    // Constructor to initialize next pointers and optionally data
    Node(int data = 0) : data(data)
    {
        for (int i = 0; i < 5; ++i)
        {
            next[i] = nullptr;
        }
        this->hub = nullptr;
    }
    void print(Node *nodes[], int n)
    {
        cout << "Data and address after connecting:" << endl;
        for (int i = 0; i < n; ++i)
        {
            cout << "Device " << i + 1 << ": " << endl;
            if (nodes[i]->data != 0)
            {
                cout << "DATA==" << nodes[i]->data << endl;
            }
            for (int j = 0; j < 5; j++)
            {
                cout << "connected t " << j + 1 << ": ";
                cout << nodes[i]->next[j];
                cout << endl;
            }
            // else {
            //     cout << "No data";
            // }
            cout << endl;
        }
    }
    void mesh(Node *nodes[], int n, Node prin)
    {
        cout << "Connect devices? (yes/no): ";
        string s1;

        cin >> s1;
        if (s1 == "yes")
        {
            for (int i = 0; i < 10; ++i)
            {
                cout << "Enter Devices(device1 and device 2) to connect (or -1 -1 to exit): ";
                int a, b;
                cin >> a >> b;
                if (a == -1 && b == -1)
                    break;
                if (a < 1 || a > n || b < 1 || b > n)
                {
                    cout << "Invalid Device numbers" << endl;
                    continue;
                }
                nodes[a - 1]->next[b - 1] = nodes[b - 1];
                nodes[b - 1]->next[a - 1] = nodes[a - 1];
                cout << a << " and " << b << " are connected" << endl;
            }
        }
        // printing
        prin.print(nodes, n);
        string s2;

        cout << "Want to Send Data?" << endl;
        cin >> s2;

        if (s2 == "yes")
        {
            for (int i = 0; i < n; i++)
            {
                for (int j = 1; j < 5; j++)
                {
                    if (nodes[i]->next[j] != nullptr)
                    {
                        nodes[j]->data = nodes[i]->data;
                        cout << "Data transfer between " << i + 1 << " and " << j + 1 << endl;
                    }
                }
            }
        }
        cout << "Your Data distribution after sending data\n";
        prin.print(nodes, n);
    }
    void star(Node *nodes[], int n, Node prin)
    {

        cout << "Create Hub (yes or no)";
        string c;
        cin >> c;
        int h;
        if (c == "yes")
        {
            cout << " HUB created Succesfully\n";
            cout << "Enter The number of nodes connect to hub\n";
            cin >> h;
        }
        Node *Hub[h];

        cout << "want to Make connection with HUB\n";

        string yes;
        cin >> yes;
        if (yes == "yes")
        {
            for (int i = 0; i < h; i++)
            {
                Hub[i] = nodes[i];
            }
            cout << "Connection Succesful\n";
        }
        cout << "Devices that are connected to HUB\n";
        for (int i = 0; i < h; i++)
        {
            cout << "PORT " << i + 1 << "connected To " << Hub[i] << endl;
        }

        // *******************************************************
        cout << "Want to Send Data in Star topology\n";
        string check;
        cin >> check;
        int data;
        if (check == "yes")
        {

            data = nodes[0]->data;
            for (int i = 1; i < n; i++)
            {
                Hub[i]->data = data;
            }
        }
        cout << "Data Distribution After connection\n";
        prin.print(nodes, n);
    }
};

int main()
{
    // _________________________________________________________________________________________________________________
    cout << "Enter the number of Devices to create: ";
    int n;
    cin >> n;

    // Create an array of nodes
    Node *nodes[n];
    for (int i = 0; i < n; ++i)
    {
        cout << "Enter data for Device " << i + 1 << " (or -1 if no data): ";
        int data;
        cin >> data;
        if (data != -1)
            nodes[i] = new Node(data);
        else
        {
            nodes[i] = new Node(NULL);
        }
    }

    // Print the data of the created nodes
    cout << "Data of the created nodes:" << endl;
    for (int i = 0; i < n; ++i)
    {
        cout << "Device " << i + 1 << ": " << endl;
        if (nodes[i]->data != 0)
        {
            cout << "DATA==" << nodes[i]->data << endl;
        }
        cout << "ADDRESS==" << nodes[i] << endl;
        for (int j = 0; j < 5; j++)
        {
            cout << "connected To " << j + 1 << ": ";
            cout << nodes[i]->next[j];
            cout << endl;
        }

        cout << endl;
    }

    cout << "1.Mesh or Ring\n";
    cout << "2.Star Topology\n";
    cout << "Enter Choice here" << endl;
    int choice;
    cin >> choice;
    Node prin;
    if (choice == 1)
    {
        prin.mesh(nodes, n, prin);
    }
    else
    {
        prin.star(nodes, n, prin);
    }

    return 0;
}