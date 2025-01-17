document.addEventListener("DOMContentLoaded", function () {
    class Node {
        constructor(data) {
            this.data = data;
            this.next = null;
        }
    }

    class LinkedList {
        constructor() {
            this.head = null;
        }

        add(data) {
            const newNode = new Node(data);
            if (!this.head) {
                this.head = newNode;
            } else {
                let current = this.head;
                while (current.next) {
                    current = current.next;
                }
                current.next = newNode;
            }
        }

        remove(data) {
            if (!this.head) return;
            if (this.head.data === data) {
                this.head = this.head.next;
                return;
            }
            let current = this.head;
            while (current.next && current.next.data !== data) {
                current = current.next;
            }
            if (current.next) {
                current.next = current.next.next;
            }
        }

        toArray() {
            const result = [];
            let current = this.head;
            while (current) {
                result.push(current.data);
                current = current.next;
            }
            return result;
        }

        get size() {
            return this.toArray().length;
        }
    }

    const patients = new LinkedList();
    const receptionists = new LinkedList();
    const patientsPassedGuiche = new LinkedList();
    const doctors = new LinkedList();
    const stats = {
        totalPatients: 0,
        receptionistStats: {},
        doctorStats: {},
    };

    function updateGuiches() {
        const guicheContainer = document.getElementById("guiche-container");
        if (!guicheContainer || receptionists.size === 0) {
            guicheContainer.innerHTML = "<p>Nenhum guichê cadastrado.</p>";
            return;
        }

        guicheContainer.innerHTML = receptionists.toArray()
            .map((name, index) => `
                <div class="guiche">
                    <h3>Guichê ${index + 1} - ${name}</h3>
                    <ul id="guiche-${index}-list"></ul>
                    <button data-guiche="${index}" class="atender-btn">Atender Próximo Paciente</button>
                </div>
            `)
            .join("");

        document.querySelectorAll(".atender-btn").forEach(button => {
            button.addEventListener("click", function () {
                atenderPaciente(parseInt(this.getAttribute("data-guiche")));
            });
        });

        updateQueues();
    }

    function updateDoctors() {
        const doctorContainer = document.getElementById("doctor-container");
        if (!doctorContainer || doctors.size === 0) {
            doctorContainer.innerHTML = "<p>Nenhum médico cadastrado.</p>";
            return;
        }

        doctorContainer.innerHTML = doctors.toArray()
            .map((name, index) => `
                <div class="doctor">
                    <h3>Médico ${index + 1} - ${name}</h3>
                    <ul id="doctor-${index}-list"></ul>
                    <button data-doctor="${index}" class="atender-doctor-btn">Atender Próximo Paciente</button>
                </div>
            `)
            .join("");

        document.querySelectorAll(".atender-doctor-btn").forEach(button => {
            button.addEventListener("click", function () {
                atenderPacienteMedico(parseInt(this.getAttribute("data-doctor")));
            });
        });

        updateDoctorQueues();
    }

    function updateQueues() {
        const prioritizedPatients = prioritizePatients();

        receptionists.toArray().forEach((_, index) => {
            const guicheList = document.getElementById(`guiche-${index}-list`);
            if (guicheList) {
                guicheList.innerHTML = prioritizedPatients
                    .filter((p, i) => i % receptionists.size === index)
                    .map(p => `<li>${p.name} - ${p.type}</li>`)
                    .join("");
            }
        });
    }

    function updateDoctorQueues() {
        const patientsArray = patientsPassedGuiche.toArray();
        doctors.toArray().forEach((_, index) => {
            const doctorList = document.getElementById(`doctor-${index}-list`);
            if (doctorList) {
                doctorList.innerHTML = patientsArray
                    .filter((p, i) => i % doctors.size === index)
                    .map(p => `<li>${p.name}</li>`)
                    .join("");
            }
        });
    }

    function prioritizePatients() {
        return patients.toArray().sort((a, b) => {
            const priorityOrder = { urgencia: 1, prioridade: 2, normal: 3 };
            return priorityOrder[a.type] - priorityOrder[b.type];
        });
    }

    function atenderPaciente(guicheIndex) {
        const prioritizedPatients = prioritizePatients();
        const guichePatients = prioritizedPatients.filter(
            (_, i) => i % receptionists.size === guicheIndex
        );

        if (guichePatients.length === 0) {
            alert(`Nenhum paciente na fila do Guichê ${guicheIndex + 1}.`);
            return;
        }

        const patient = guichePatients[0];
        patients.remove(patient);
        patientsPassedGuiche.add(patient);
        stats.receptionistStats[receptionists.toArray()[guicheIndex]] =
            (stats.receptionistStats[receptionists.toArray()[guicheIndex]] || 0) + 1;

        updateQueues();
        updateDoctorQueues();
        alert(`Paciente ${patient.name} foi atendido no Guichê ${guicheIndex + 1}.`);
    }

    function atenderPacienteMedico(doctorIndex) {
        const doctorPatients = patientsPassedGuiche.toArray().filter(
            (_, i) => i % doctors.size === doctorIndex
        );

        if (doctorPatients.length === 0) {
            alert(`Nenhum paciente na fila para o Médico ${doctorIndex + 1}.`);
            return;
        }

        const patient = doctorPatients[0];
        patientsPassedGuiche.remove(patient);
        stats.doctorStats[doctors.toArray()[doctorIndex]] =
            (stats.doctorStats[doctors.toArray()[doctorIndex]] || 0) + 1;

        updateDoctorQueues();
        alert(`Paciente ${patient.name} foi atendido pelo Médico ${doctors.toArray()[doctorIndex]}.`);
    }

    document.getElementById("receptionist-form")?.addEventListener("submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("receptionist-name").value.trim();
        if (name) {
            receptionists.add(name);
            stats.receptionistStats[name] = 0;
            updateGuiches();
        }
    });

    document.getElementById("doctor-form")?.addEventListener("submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("doctor-name").value.trim();
        if (name) {
            doctors.add(name);
            stats.doctorStats[name] = 0;
            updateDoctors();
        }
    });

    document.getElementById("patient-form")?.addEventListener("submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("patient-name").value.trim();
        const type = document.getElementById("patient-type").value;
        if (name) {
            patients.add({ name, type });
            stats.totalPatients++;
            updateQueues();
        }
    });

    document.getElementById("generate-stats")?.addEventListener("click", function () {
        const statsContainer = document.getElementById("stats-container");
        statsContainer.innerHTML = `
            <h3>Estatísticas</h3>
            <p>Total de Pacientes: ${stats.totalPatients}</p>
            <ul>
                ${Object.entries(stats.receptionistStats)
                    .map(([name, count]) => `<li>${name}: ${count}</li>`)
                    .join("")}
            </ul>
            <ul>
                ${Object.entries(stats.doctorStats)
                    .map(([name, count]) => `<li>${name}: ${count}</li>`)
                    .join("")}
            </ul>
        `;
    });

    function generateStatistics() {
        const statsContainer = document.getElementById("stats-container");
        statsContainer.innerHTML = `
            <h3>Estatísticas Gerais</h3>
            <p><strong>Total de Pacientes Atendidos:</strong> ${stats.totalPatients}</p>
            <h3>Pacientes por Recepcionista</h3>
            <ul>
                ${Object.entries(stats.patientsByReceptionist)
                    .map(([name, count]) => `<li>${name}: ${count} pacientes</li>`)
                    .join("")}
            </ul>
            <h3>Pacientes por Médico</h3>
            <ul>
                ${Object.entries(stats.patientsByDoctor)
                    .map(([name, count]) => `<li>${name}: ${count} pacientes</li>`)
                    .join("")}
            </ul>
            <h3>Distribuição por Prioridade</h3>
            <ul>
                ${Object.entries(stats.priorityLevels)
                    .map(
                        ([priority, count]) =>
                            `<li>${capitalize(priority)}: ${count} pacientes</li>`
                    )
                    .join("")}
            </ul>
        `;
    }

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    document.getElementById("generate-stats").addEventListener("click", generateStatistics);


    updateGuiches();
    updateDoctors();
});