import React from 'react';
import '../App.css';

const Tutorial: React.FC = () => {
    return (
        <div className={"tutorialContainer"}>
            <h1>U-Probe Tutorial: Designing Universal Probes</h1>
            
            <section className={"tutorialSection"}>
                <h2>1. Getting Started</h2>
                <p>Welcome to U-Probe, your universal tool for designing and optimizing probes for various applications, including fluorescence in situ hybridization (FISH).</p>
                <ul>
                    <li>Navigate to the home page and click on "Start Designing" to begin your probe design process.</li>
                    <li>Familiarize yourself with the interface, including the Design, Genome, and Task tabs in the top navigation.</li>
                </ul>
            </section>

            <section className={"tutorialSection"}>
                <h2>2. Designing Your Probe</h2>
                <p>Follow these steps to create a custom probe:</p>
                <ol>
                    <li>Select your target organism and genome assembly from the dropdown menus.</li>
                    <li>Input your target sequence or gene of interest.</li>
                    <li>Specify desired probe length and any additional parameters (e.g., GC content, melting temperature).</li>
                    <li>Click "Generate Probe" to view potential probe sequences.</li>
                </ol>
            </section>

            <section className={"tutorialSection"}>
                <h2>3. Optimizing Your Probe</h2>
                <p>U-Probe offers various tools to optimize your probe design:</p>
                <ul>
                    <li>Use the "View Examples" feature to see successful probe designs for similar applications.</li>
                    <li>Adjust parameters in real-time to see how they affect probe specificity and efficiency.</li>
                    <li>Utilize our built-in BLAST tool to check for off-target binding.</li>
                </ul>
            </section>

            <section className={"tutorialSection"}>
                <h2>4. Uploading Custom Data</h2>
                <p>For advanced users, U-Probe allows you to upload custom genomic data:</p>
                <ol>
                    <li>Click on the "Upload Data" button on the home page.</li>
                    <li>Select your file format (FASTA, GFF, etc.) and upload your data.</li>
                    <li>Use your custom data in conjunction with our probe design tools for highly specific results.</li>
                </ol>
            </section>

            <section className={"tutorialSection"}>
                <h2>5. Analyzing Results</h2>
                <p>After generating your probe:</p>
                <ul>
                    <li>Review the probe sequence, predicted binding sites, and potential off-target effects.</li>
                    <li>Use our visualization tools to see where your probe binds within the genome.</li>
                    <li>Export your results for use in your experiments or further analysis.</li>
                </ul>
            </section>

            <section className={"tutorialSection"}>
                <h2>Need Help?</h2>
                <p>If you have any questions or encounter issues while using U-Probe, please don't hesitate to contact our support team or refer to our detailed documentation.</p>
            </section>
        </div>
    );
};

export default Tutorial;