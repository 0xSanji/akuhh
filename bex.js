import { ethers } from "ethers";
import chalk from "chalk";
import readline from "readline";

// Replace with your contract address and Ethereum provider URL
const CONTRACT_ADDRESS = "0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D";
const PROVIDER_URL = "https://bartio.rpc.berachain.com";

// ABI for the contract
const ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "poolIdx", type: "uint256" },
          { internalType: "address", name: "base", type: "address" },
          { internalType: "address", name: "quote", type: "address" },
          { internalType: "bool", name: "isBuy", type: "bool" },
        ],
        internalType: "struct SwapHelpers.SwapStep[]",
        name: "_steps",
        type: "tuple[]",
      },
      { internalType: "uint128", name: "_amount", type: "uint128" },
    ],
    name: "previewMultiSwap",
    outputs: [
      { internalType: "uint128", name: "out", type: "uint128" },
      { internalType: "uint256", name: "predictedQty", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "poolIdx", type: "uint256" },
          { internalType: "address", name: "base", type: "address" },
          { internalType: "address", name: "quote", type: "address" },
          { internalType: "bool", name: "isBuy", type: "bool" },
        ],
        internalType: "struct SwapHelpers.SwapStep[]",
        name: "_steps",
        type: "tuple[]",
      },
      { internalType: "uint128", name: "_amount", type: "uint128" },
      { internalType: "uint128", name: "_minOut", type: "uint128" },
    ],
    name: "multiSwap",
    outputs: [{ internalType: "uint128", name: "out", type: "uint128" }],
    stateMutability: "payable",
    type: "function",
  },
];

const token = {
  HONEY: "0x0e4aaf1351de4c0264c5c7056ef3777b41bd8e03",
  BURR: "0x1bc1a92fcdf8df49d6e2b62f62a7ccf665c9d9a7",
  //   WBTC: "0x2577d24a26f8fa19c1058a8b0106e2c7303454a4", //36001
  //   WETH: "0xe28afd8c634946833e89ee3f122c06d7c537e8a8", // 36001 true
  //   HENLO: "0x9729e69cd6a53fc75e130960a035bd145ce71851", // 36001 true
  LBGT: "0x32cf940db5d7ea3e95e799a805b1471341241264", // 36000
  iBGT: "0x46efc86f0d7455f135cc9df501673739d513e982", // 36000
  YEET: "0x1740F679325ef3686B2f574e392007A92e4BeD41", // 36000
  //   USDT: "0x05d0dd5135e3ef3ade32a9ef9cb06e8d37a6795d", // 36000
  wbHONEY: "0x556b758acce5c4f2e1b57821e2dd797711e790f4", // 36000
};

const poolIdx = {
  HONEY: "0x8ca0",
  BURR: "0x8ca0",
  LBGT: "0x8ca0", // 36000
  iBGT: "0x8ca0", // 36000
  YEET: "0x8ca0", // 36000
  //   USDT: "0x8ca0", // 36000
  wbHONEY: "0x8ca0", // 36000
  //   WBTC: "0x8ca1", //36001
  //   WETH: "0x8ca1", // 36001 true
  //   HENLO: "0x8ca1", // 36001 true
};

// Connect to Ethereum
// const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
// const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
// const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function previewMultiSwap(key) {
  try {
    let steps = [
      {
        poolIdx: poolIdx[key],
        base: token[key],
        quote: "0x7507c1dc16935b82698e4c63f2746a2fcf994df8",
        isBuy: false,
      },
    ];

    if (key == "WETH" || key == "HENLO") {
      steps = [
        {
          poolIdx: poolIdx[key],
          base: "0x7507c1dc16935b82698e4c63f2746a2fcf994df8",
          quote: token[key],
          isBuy: true,
        },
      ];
    }

    const amount = ethers.parseUnits(amountInput, 18); // Example: 10 tokens with 18 decimals

    // Call the function
    const [out, predictedQty] = await contract.previewMultiSwap(steps, amount);
    // console.log("Output Amount:", ethers.formatEther(out).toString());
    // console.log(
    //   "Predicted Quantity:",
    //   ethers.formatEther(predictedQty).toString()
    // );
    return out;
  } catch (err) {
    console.error("Error previewing multiSwap:", err);
  }
}

async function multiSwap(key, minOut) {
  try {
    let steps = [
      {
        poolIdx: poolIdx[key],
        base: token[key],
        quote: "0x0000000000000000000000000000000000000000",
        isBuy: false,
      },
    ];

    if (key == "WETH" || key == "HENLO") {
      steps = [
        {
          poolIdx: poolIdx[key],
          base: "0x0000000000000000000000000000000000000000",
          quote: token[key],
          isBuy: true,
        },
      ];
    }
    const amount = ethers.parseUnits(amountInput, 18); // Example: 10 tokens with 18 decimals

    // Define slippage tolerance (1%)
    const slippageTolerance = 5; // 1%

    // Example: Token amount in Wei (large number - string format to avoid precision issues)
    // const tokenAmount = "6416255696914965835"; // This is 6.41625 tokens in Wei

    // Calculate slippage amount (1% slippage)
    const slippageAmount = (parseInt(minOut) * slippageTolerance) / 100; // 1% slippage

    // Calculate minimum acceptable output (subtract slippage from tokenAmount)
    minOut = (parseInt(minOut) - slippageAmount).toString();

    // Get gas fee data
    const feeData = await provider.getFeeData();
    console.log(
      `Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`
    );

    // Send the multiSwap transaction
    const tx = await contract.multiSwap(steps, amount, minOut, {
      value: amount, // If the transaction is payable
      //   gasPrice: feeData.gasPrice, // Include gas price
      //   gasLimit: 3000000, // Include estimated gas limit
    });
    console.log(chalk.bold.green("\n=== Transaction Receipt ==="));
    console.log(
      `${chalk.blue("Transaction Hash:")} ${chalk.yellow(
        "https://bartio.beratrail.io/tx/" + tx.hash
      )}`
    );

    const receipt = await tx.wait();
    console.log(
      `${chalk.blue("Status:")} ${chalk.yellow(
        receipt.status === 1 ? "Success" : "Fail"
      )}`
    );
  } catch (err) {
    console.error("Error executing multiSwap:", err);
  }
}

// Function to clear the screen
function clearScreen() {
  process.stdout.write("\x1Bc");
}

// Setup readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Global variables
let provider;
let wallet;
let contract;
let amountInput;

// Function to ask user for input
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// Run the functions
(async () => {
  // Ask for private key and amount
  let privateKeys = await askQuestion("Enter your private key: ");
  privateKeys = privateKeys.split(",").map((pk) => pk.trim());

  const amountInputCLI = await askQuestion(
    "Enter the amount in Ether (default is 1): "
  );

  clearScreen();

  // If no amount is provided, default to 1
  amountInput = amountInputCLI || "1"; // Default to 1 Ether if no input

  // Check if private key is provided
  for (const privateKey of privateKeys) {
    if (!privateKey) {
      console.error("Error: Please provide a private key.");
      process.exit(1); // Exit the program if no private key is provided
    }

    // Setup provider and wallet
    provider = new ethers.JsonRpcProvider(PROVIDER_URL); // RPC provider URL
    wallet = new ethers.Wallet(privateKey, provider); // Create wallet from private key
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet); // Contract instance

    const address = wallet.address;
    let balance = ethers.formatEther(await provider.getBalance(address));

    //   for (const key in token) {
    //     if (token.hasOwnProperty(key)) {
    //       console.log(`${key}: ${token[key]}`);
    //       const minOut = await previewMultiSwap(key);
    //       console.log(minOut);
    //     }
    //   }

    while (balance > parseFloat(amountInput)) {
      // Get all keys as an array
      const keys = Object.keys(token);
      // Randomly select a key
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      // Get the corresponding value
      const randomValue = randomKey;

      const minOut = await previewMultiSwap(randomValue);

      // Display results with colors
      console.log(chalk.bold.blue(`=== Wallet Summary ===`));
      console.log(chalk.green(`Address: ${address}`));
      console.log(chalk.yellow(`Total ETH Balance: ${balance} BERA`));
      console.log(chalk.cyan(`Token: ${randomKey}`));
      console.log(chalk.magenta(`Token Amount: ${ethers.formatEther(minOut)}`));

      await multiSwap(randomValue, minOut);

      balance = ethers.formatEther(await provider.getBalance(address));
      await sleep(10000); // 10 detik
    }
  }
  rl.close();
})();
